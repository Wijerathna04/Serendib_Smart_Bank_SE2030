package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.dto.BankResponses.TransactionView;
import com.smartbank.smartbank_api.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

/** The only application service allowed to mutate Account.balance. */
@Service @RequiredArgsConstructor
public class TransactionPostingService {
    private final TransactionService transactions;
    private final TransactionRecordRepository records;
    private final AccountRepository accounts;
    private final FixedDepositRepository deposits;
    private final BillPaymentRepository bills;
    private final CurrentUserService current;
    private final OtpService otp;
    private final OtpDeliveryService delivery;
    private final NotificationService notifications;
    private final AuditLogService audit;
    private final Clock clock;
    public record Outcome(TransactionView transaction,String errorCode,String message) {}

    @Transactional public Outcome verify(Integer id,String code) {
        User user=current.requireUser(); TransactionRecord t=transactions.lockInitiated(id,user.getUserId());
        if("COMPLETED".equals(t.getStatus())) return success(t,user);
        BankRules.require("PENDING".equals(t.getStatus()),"INVALID_STATE","Transaction is no longer pending");
        if(!t.getAuthorizationExpiresAt().isAfter(LocalDateTime.now(clock))) return fail(t,user,"AUTHORIZATION_EXPIRED","Authorization has expired");
        String error=otp.check(t,code);
        if(error!=null) {
            audit.record(user,"OTP_FAILED","TransactionRecord",id);
            if("OTP_LOCKED".equals(error)) return fail(t,user,error,"OTP attempt limit exceeded");
            return new Outcome(ResponseMapper.transaction(t,user.getUserId()),error,"OTP is invalid or expired");
        }
        FixedDeposit fd=null;
        if("FD_OPEN".equals(t.getTransactionType())) fd=deposits.findByOpeningTransaction_TransactionId(id).orElseThrow(ResourceNotFoundException::new);
        if("FD_CLOSE".equals(t.getTransactionType())) fd=deposits.findByClosingTransaction_TransactionId(id).orElseThrow(ResourceNotFoundException::new);
        if(fd!=null) {
            fd=deposits.lockById(fd.getFixedDepositId()).orElseThrow(ResourceNotFoundException::new);
            BankRules.require(("FD_OPEN".equals(t.getTransactionType()) && "PENDING".equals(fd.getStatus())) || ("FD_CLOSE".equals(t.getTransactionType()) && "MATURED".equals(fd.getStatus())),"INVALID_STATE","Deposit state no longer permits this transaction");
        }
        // Always lock account IDs in ascending order to avoid opposing-transfer deadlocks.
        SortedSet<Integer> ids=new TreeSet<>();
        if(t.getFromAccount()!=null) ids.add(t.getFromAccount().getAccountId());
        if(t.getToAccount()!=null) ids.add(t.getToAccount().getAccountId());
        Map<Integer,Account> locked=new HashMap<>(); for(Integer accountId:ids) locked.put(accountId,accounts.lockById(accountId).orElseThrow(ResourceNotFoundException::new));
        Account from=t.getFromAccount()==null?null:locked.get(t.getFromAccount().getAccountId());
        Account to=t.getToAccount()==null?null:locked.get(t.getToAccount().getAccountId());
        for(Account a:locked.values()) if(!"ACTIVE".equals(a.getStatus())) return fail(t,user,"INACTIVE_ACCOUNT","An account is no longer active");
        Account owned=from==null?to:from;
        if(owned==null || !owned.getCustomer().getUser().getUserId().equals(user.getUserId())) throw new ResourceNotFoundException();
        boolean isOtherBank = "TRANSFER".equals(t.getTransactionType()) && (to == null || (t.getExternalBank() != null && !t.getExternalBank().toLowerCase().contains("serendib")));
        java.math.BigDecimal fee = isOtherBank ? new java.math.BigDecimal("25.00") : java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalDeduct = t.getAmount().add(fee);
        if(from!=null && from.getBalance().compareTo(totalDeduct)<0) return fail(t,user,"INSUFFICIENT_BALANCE","Insufficient account balance");
        if(to!=null && to.getBalance().add(t.getAmount()).compareTo(BankRules.MAX_MONEY)>0) return fail(t,user,"BALANCE_LIMIT","Destination balance limit exceeded");
        // No balances are changed until all business checks have succeeded.
        if(from!=null) from.setBalance(from.getBalance().subtract(totalDeduct));
        if(to!=null) to.setBalance(to.getBalance().add(t.getAmount()));
        LocalDateTime now=LocalDateTime.now(clock);
        t.setStatus("COMPLETED"); t.setCompletedAt(now);
        if(fd!=null) {
            if("FD_OPEN".equals(t.getTransactionType())) { fd.setStatus("ACTIVE"); fd.setStartDate(LocalDate.now(clock)); fd.setMaturityDate(fd.getStartDate().plusMonths(fd.getTermMonths())); fd.setMaturityAmount(FixedDepositService.maturity(fd.getPrincipalAmount(),fd.getInterestRate(),fd.getTermMonths())); }
            else fd.setStatus("CLOSED");
            fd.setUpdatedAt(now);
        }
        if("BILL_PAYMENT".equals(t.getTransactionType())) { BillPayment b=bills.findByTransaction_TransactionId(id).orElseThrow(ResourceNotFoundException::new); b.setStatus("COMPLETED"); b.setPaymentDate(LocalDate.now(clock)); b.setCompletedAt(now); }
        String event=switch(t.getTransactionType()) { case "FD_OPEN" -> "FIXED_DEPOSIT_CREATED"; case "FD_CLOSE" -> "FIXED_DEPOSIT_CLOSED"; default -> t.getTransactionType()+"_SUCCESS"; };
        audit.record(user,"OTP_VERIFIED","TransactionRecord",id); audit.record(user,event,"TransactionRecord",id);
        String feeMsg = isOtherBank ? " (+ LKR 25.00 service fee)" : "";
        notifications.createNotification(user.getUserId(),event,"Banking operation completed","Transaction #"+id+" completed for LKR "+t.getAmount().toPlainString()+feeMsg+".");
        if("TRANSFER".equals(t.getTransactionType()) && to!=null && !to.getCustomer().getUser().getUserId().equals(user.getUserId())) notifications.createNotification(to.getCustomer().getUser().getUserId(),"TRANSFER_RECEIVED","Transfer received","You received LKR "+t.getAmount().toPlainString()+".");
        return success(t,user);
    }
    private Outcome success(TransactionRecord t,User user) { return new Outcome(ResponseMapper.transaction(t,user.getUserId()),null,null); }
    private Outcome fail(TransactionRecord t,User user,String code,String message) {
        t.setStatus("FAILED"); t.setFailureCode(code); t.setCompletedAt(LocalDateTime.now(clock)); delivery.remove(t.getTransactionId());
        synchronizeAbortedDomain(t,"FAILED"); audit.record(user,t.getTransactionType()+"_FAILED","TransactionRecord",t.getTransactionId());
        notifications.createNotification(user.getUserId(),t.getTransactionType()+"_FAILED","Banking operation not completed","Transaction #"+t.getTransactionId()+": "+message+". No money was moved.");
        return new Outcome(ResponseMapper.transaction(t,user.getUserId()),code,message);
    }
    private void synchronizeAbortedDomain(TransactionRecord t,String status) {
        if("FD_OPEN".equals(t.getTransactionType())) deposits.findByOpeningTransaction_TransactionId(t.getTransactionId()).ifPresent(f->{f.setStatus("CANCELLED");f.setUpdatedAt(LocalDateTime.now(clock));});
        if("BILL_PAYMENT".equals(t.getTransactionType())) bills.findByTransaction_TransactionId(t.getTransactionId()).ifPresent(b->b.setStatus(status));
    }
    @Transactional public TransactionView cancel(Integer id) {
        User u=current.requireUser(); TransactionRecord t=transactions.lockInitiated(id,u.getUserId());
        if("CANCELLED".equals(t.getStatus())) return ResponseMapper.transaction(t,u.getUserId());
        BankRules.require("PENDING".equals(t.getStatus()),"INVALID_STATE","Only pending operations can be cancelled");
        t.setStatus("CANCELLED"); t.setCompletedAt(LocalDateTime.now(clock)); synchronizeAbortedDomain(t,"CANCELLED"); delivery.remove(id);
        audit.record(u,t.getTransactionType()+"_CANCELLED","TransactionRecord",id);
        notifications.createNotification(u.getUserId(),t.getTransactionType()+"_CANCELLED","Request cancelled","Transaction #"+id+" was cancelled. No money was moved.");
        return ResponseMapper.transaction(t,u.getUserId());
    }
    @Transactional public void resend(Integer id) { User u=current.requireUser(); TransactionRecord t=transactions.lockInitiated(id,u.getUserId()); otp.issue(t); }
    @Transactional public void expire(Integer id) {
        TransactionRecord t=records.lockById(id).orElseThrow(ResourceNotFoundException::new);
        if("PENDING".equals(t.getStatus()) && !t.getAuthorizationExpiresAt().isAfter(LocalDateTime.now(clock))) fail(t,t.getInitiatedBy(),"AUTHORIZATION_EXPIRED","Authorization has expired");
    }
}
