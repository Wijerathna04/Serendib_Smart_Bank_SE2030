package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.dto.BankRequests.Deposit;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import com.smartbank.smartbank_api.config.FixedDepositProperties;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.math.*;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class FixedDepositService {
    private final FixedDepositRepository deposits;
    private final CurrentUserService current;
    private final TransactionService transactions;
    private final OtpService otp;
    private final AuditLogService audit;
    private final NotificationService notifications;
    private final FixedDepositProperties properties;
    private final Clock clock;
    private final ObjectMapper objectMapper;

    public record Product(Integer termMonths, String annualRate, String minimumAmount, String disclosure) {}

    public List<Product> products() {
        return properties.getRates().entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(e -> new Product(e.getKey(), e.getValue().toPlainString(), properties.getMinimumAmount().toPlainString(), "Simulated academic rate; not a real bank offer"))
            .toList();
    }

    public static BigDecimal maturity(BigDecimal principal, BigDecimal rate, int months) {
        return principal.add(
            principal.multiply(rate).multiply(BigDecimal.valueOf(months))
                .divide(new BigDecimal("1200"), 12, RoundingMode.HALF_EVEN)
        ).setScale(2, RoundingMode.HALF_EVEN);
    }

    public DepositView create(Deposit r, String key) {
        User user = current.requireUser();
        BigDecimal principal = BankRules.money(r.principalAmount());
        String hash = TransactionService.fingerprint("FD_OPEN", r.accountId().toString(), principal.toPlainString(), r.termMonths().toString());

        var old = transactions.existing(user, key, hash);
        if (old.isPresent()) {
            return ResponseMapper.deposit(deposits.findByOpeningTransaction_TransactionId(old.get().getTransactionId()).orElseThrow(ResourceNotFoundException::new));
        }

        BigDecimal rate = properties.getRates().get(r.termMonths());
        BankRules.require(rate != null && rate.signum() >= 0, "INVALID_TERM", "Choose a supported term");
        BankRules.require(principal.compareTo(properties.getMinimumAmount()) >= 0, "MINIMUM_DEPOSIT", "Principal is below the configured minimum (LKR 25,000)");

        Account a = current.requireOwnedAccount(r.accountId());
        BankRules.active(a);
        BankRules.require(a.getBalance().compareTo(principal) >= 0, "INSUFFICIENT_BALANCE", "Insufficient account balance");

        boolean requiresManagerApproval = principal.compareTo(new BigDecimal("1000000.00")) > 0;

        FixedDeposit f = new FixedDeposit();
        f.setAccount(a);
        f.setPrincipalAmount(principal);
        f.setInterestRate(rate);
        f.setTermMonths(r.termMonths());
        f.setCreatedAt(LocalDateTime.now(clock));
        f.setUpdatedAt(f.getCreatedAt());

        Map<String, Object> detailsMap = new LinkedHashMap<>();
        detailsMap.put("payoutFrequency", r.interestPayoutFrequency() != null ? r.interestPayoutFrequency() : "On Maturity");
        detailsMap.put("maturityInstruction", r.maturityInstruction() != null ? r.maturityInstruction() : "Auto-Renew Principal & Interest");
        detailsMap.put("fatca", Boolean.TRUE.equals(r.fatcaCompliance()));
        detailsMap.put("pep", Boolean.TRUE.equals(r.pepDeclaration()));
        String detailsJson;
        try {
            detailsJson = objectMapper.writeValueAsString(detailsMap);
        } catch (Exception e) {
            detailsJson = "{}";
        }
        f.setFdDetails(detailsJson);

        if (requiresManagerApproval) {
            f.setStatus("PENDING_MANAGER_APPROVAL");
            // Do not create opening transaction or debit funds until approved by Branch Manager
            deposits.save(f);
            audit.record(user, "FIXED_DEPOSIT_SUBMITTED_MANAGER_REVIEW", "FixedDeposit", f.getFixedDepositId());
            notifications.createNotification(
                user.getUserId(),
                "FD_MANAGER_APPROVAL_REQUIRED",
                "Fixed Deposit Awaiting Manager Approval",
                "Your fixed deposit request for LKR " + principal + " (> LKR 1 Million) has been submitted and requires Branch Manager approval before activation."
            );
        } else {
            TransactionRecord t = transactions.createPending(user, a, null, principal, "FD_OPEN", "Fixed deposit funding", key, hash);
            f.setStatus("PENDING");
            f.setOpeningTransaction(t);
            deposits.save(f);
            t.setDescription("Fixed deposit #" + f.getFixedDepositId() + " funding");
            otp.issue(t);
            audit.record(user, "FIXED_DEPOSIT_REQUESTED", "FixedDeposit", f.getFixedDepositId());
        }

        return ResponseMapper.deposit(f);
    }

    @Transactional(readOnly=true)
    public PageResult<DepositView> listPendingManager(int page, int size) {
        current.requireUser(); // Employee or Manager
        return PageResult.from(deposits.findByStatus("PENDING_MANAGER_APPROVAL", BankRules.page(page, size, "createdAt")).map(ResponseMapper::deposit));
    }

    public DepositView managerApprove(Integer id, String key) {
        current.requireEmployee(); // Manager or Employee
        FixedDeposit f = deposits.lockById(id).orElseThrow(ResourceNotFoundException::new);
        BankRules.require("PENDING_MANAGER_APPROVAL".equals(f.getStatus()), "INVALID_STATE", "Fixed deposit is not awaiting manager approval");

        String hash = TransactionService.fingerprint("FD_OPEN", f.getAccount().getAccountId().toString(), f.getPrincipalAmount().toPlainString(), f.getTermMonths().toString());
        User owner = f.getAccount().getCustomer().getUser();

        TransactionRecord t = transactions.createPending(owner, f.getAccount(), null, f.getPrincipalAmount(), "FD_OPEN", "Fixed deposit #" + f.getFixedDepositId() + " funding", key, hash);
        f.setOpeningTransaction(t);
        f.setStatus("PENDING");
        f.setUpdatedAt(LocalDateTime.now(clock));
        deposits.save(f);

        otp.issue(t);
        audit.record(current.requireUser(), "FIXED_DEPOSIT_APPROVED_BY_MANAGER", "FixedDeposit", f.getFixedDepositId());
        notifications.createNotification(
            owner.getUserId(),
            "FD_MANAGER_APPROVED",
            "Fixed Deposit Approved",
            "Your fixed deposit request #" + f.getFixedDepositId() + " for LKR " + f.getPrincipalAmount() + " was approved by the Branch Manager. Please complete OTP verification to transfer funds."
        );

        return ResponseMapper.deposit(f);
    }

    public DepositView managerReject(Integer id, String reason) {
        current.requireEmployee();
        FixedDeposit f = deposits.lockById(id).orElseThrow(ResourceNotFoundException::new);
        BankRules.require("PENDING_MANAGER_APPROVAL".equals(f.getStatus()), "INVALID_STATE", "Fixed deposit is not awaiting manager approval");

        f.setStatus("REJECTED");
        f.setUpdatedAt(LocalDateTime.now(clock));
        deposits.save(f);

        audit.record(current.requireUser(), "FIXED_DEPOSIT_REJECTED_BY_MANAGER", "FixedDeposit", f.getFixedDepositId());
        notifications.createNotification(
            f.getAccount().getCustomer().getUser().getUserId(),
            "FD_MANAGER_REJECTED",
            "Fixed Deposit Status",
            "Your fixed deposit request #" + f.getFixedDepositId() + " was not approved. Reason: " + reason
        );

        return ResponseMapper.deposit(f);
    }

    public DepositView close(Integer id, String key) {
        User user = current.requireUser();
        String hash = TransactionService.fingerprint("FD_CLOSE", id.toString());
        var old = transactions.existing(user, key, hash);
        if (old.isPresent()) return get(id);

        FixedDeposit f = deposits.lockById(id).orElseThrow(ResourceNotFoundException::new);
        checkOwner(f, user);
        BankRules.require(!"FROZEN".equals(f.getStatus()), "FD_FROZEN", "This Fixed Deposit is currently frozen as collateral for an active loan and cannot be closed until the loan is fully paid off.");
        markMature(f);
        BankRules.require("MATURED".equals(f.getStatus()), "INVALID_STATE", "Only matured deposits can be closed");
        BankRules.active(f.getAccount());
        BankRules.require(f.getClosingTransaction() == null || !"PENDING".equals(f.getClosingTransaction().getStatus()), "CLOSURE_PENDING", "A closure already awaits OTP verification");

        TransactionRecord t = transactions.createPending(user, null, f.getAccount(), f.getMaturityAmount(), "FD_CLOSE", "Fixed deposit #" + id + " maturity settlement", key, hash);
        f.setClosingTransaction(t);
        f.setUpdatedAt(LocalDateTime.now(clock));
        otp.issue(t);
        return ResponseMapper.deposit(f);
    }

    private void checkOwner(FixedDeposit f, User user) {
        if (!f.getAccount().getCustomer().getUser().getUserId().equals(user.getUserId())) {
            throw new ResourceNotFoundException();
        }
    }

    public void markMature(FixedDeposit f) {
        if ("ACTIVE".equals(f.getStatus()) && !f.getMaturityDate().isAfter(LocalDate.now(clock))) {
            f.setStatus("MATURED");
            f.setUpdatedAt(LocalDateTime.now(clock));
            notifications.createNotification(f.getAccount().getCustomer().getUser().getUserId(), "FIXED_DEPOSIT_MATURED", "Fixed deposit matured", "Your fixed deposit #" + f.getFixedDepositId() + " is ready for closure.");
            audit.record(null, "FIXED_DEPOSIT_MATURED", "FixedDeposit", f.getFixedDepositId());
        }
    }

    @Transactional(readOnly=true)
    public PageResult<DepositView> list(int page, int size) {
        return PageResult.from(deposits.findByAccount_Customer_User_UserId(current.requireUser().getUserId(), BankRules.page(page, size, "createdAt")).map(ResponseMapper::deposit));
    }

    @Transactional(readOnly=true)
    public DepositView get(Integer id) {
        return ResponseMapper.deposit(deposits.findByFixedDepositIdAndAccount_Customer_User_UserId(id, current.requireUser().getUserId()).orElseThrow(ResourceNotFoundException::new));
    }

    @Transactional(readOnly=true)
    public DepositView staffGet(Integer id) {
        return ResponseMapper.deposit(deposits.findById(id).orElseThrow(ResourceNotFoundException::new));
    }

    @Transactional(readOnly=true)
    public PageResult<DepositView> staffSearchDeposits(String query, int page, int size) {
        var p = BankRules.page(page, size, "fixedDepositId");
        return PageResult.from((query == null || query.isBlank() ? deposits.findAll(p) : deposits.searchDeposits(query.trim(), p)).map(ResponseMapper::deposit));
    }

    public void deleteDeposit(Integer id) {
        current.requireUser();
        deposits.deleteById(id);
    }
}

