package com.smartbank.smartbank_api.service;
import com.smartbank.smartbank_api.dto.BankRequests.Bill;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
@Service @RequiredArgsConstructor @Transactional
public class BillPaymentService {
    private final BillPaymentRepository bills;
    private final CurrentUserService current;
    private final TransactionService transactions;
    private final OtpService otp;
    private final AuditLogService audit;
    private final Clock clock;
    public BillView initiate(Bill r,String key) {
        User user=current.requireUser(); var amount=BankRules.money(r.amount());
        String hash=TransactionService.fingerprint("BILL_PAYMENT",r.accountId().toString(),r.billType(),r.referenceNumber().trim(),amount.toPlainString());
        var old=transactions.existing(user,key,hash); if(old.isPresent()) return ResponseMapper.bill(bills.findByTransaction_TransactionId(old.get().getTransactionId()).orElseThrow(ResourceNotFoundException::new));
        Account a=current.requireOwnedAccount(r.accountId()); BankRules.active(a); BankRules.require(a.getBalance().compareTo(amount)>=0,"INSUFFICIENT_BALANCE","Insufficient account balance");
        TransactionRecord t=transactions.createPending(user,a,null,amount,"BILL_PAYMENT",r.billType()+" bill payment",key,hash);
        t.setBillType(r.billType()); t.setBillReference(r.referenceNumber().trim());
        BillPayment b=new BillPayment(); b.setCustomer(a.getCustomer()); b.setAccount(a); b.setTransaction(t); b.setAmount(amount); b.setBillType(r.billType()); b.setReferenceNumber(r.referenceNumber().trim()); b.setStatus("PENDING"); b.setCreatedAt(LocalDateTime.now(clock)); bills.save(b);
        otp.issue(t); audit.record(user,"BILL_PAYMENT_INITIATED","BillPayment",b.getPaymentId()); return ResponseMapper.bill(b);
    }
    @Transactional(readOnly=true) public PageResult<BillView> list(int page,int size) { return PageResult.from(bills.findByCustomer_User_UserId(current.requireUser().getUserId(),BankRules.page(page,size,"createdAt")).map(ResponseMapper::bill)); }
    @Transactional(readOnly=true) public BillView get(Integer id) { return ResponseMapper.bill(bills.findByPaymentIdAndCustomer_User_UserId(id,current.requireUser().getUserId()).orElseThrow(ResourceNotFoundException::new)); }
}
