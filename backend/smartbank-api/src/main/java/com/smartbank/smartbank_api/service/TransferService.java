package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.dto.BankRequests.Transfer;
import com.smartbank.smartbank_api.dto.BankResponses.TransactionView;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import com.smartbank.smartbank_api.exception.BusinessRuleException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service @RequiredArgsConstructor
public class TransferService {
    private final CurrentUserService current;
    private final AccountRepository accounts;
    private final BeneficiaryRepository beneficiaries;
    private final TransactionRecordRepository records;
    private final TransactionService transactions;
    private final OtpService otp;
    private final AuditLogService audit;
    private final NotificationService notifications;
    private final Clock clock;

    private boolean isOtherBank(String bankName) {
        if (bankName == null || bankName.isBlank()) return false;
        String lower = bankName.trim().toLowerCase();
        return !lower.equals("serendib") && !lower.contains("serendib bank") && !lower.contains("serendib");
    }

    @Transactional public TransactionView initiate(Transfer request, String key) {
        User user = current.requireUser();
        var amount = BankRules.money(request.amount());
        Account from = current.requireOwnedAccount(request.accountId());
        BankRules.active(from);

        String remarkOrDesc = (request.remarks() != null && !request.remarks().isBlank())
                ? request.remarks().trim()
                : (request.description() != null ? request.description().trim() : null);

        // 1. OWN ACCOUNTS TRANSFER (No OTP required)
        if (request.toAccountId() != null) {
            Account to = current.requireOwnedAccount(request.toAccountId());
            BankRules.active(to);
            BankRules.require(!from.getAccountId().equals(to.getAccountId()), "SAME_ACCOUNT", "Source and destination must differ");
            BankRules.require(from.getBalance().compareTo(amount) >= 0, "INSUFFICIENT_BALANCE", "Insufficient account balance");
            BankRules.require(to.getBalance().add(amount).compareTo(BankRules.MAX_MONEY) <= 0, "BALANCE_LIMIT", "Destination balance limit exceeded");

            String desc = remarkOrDesc != null ? remarkOrDesc : "Own account transfer";
            String hash = TransactionService.fingerprint("TRANSFER", request.accountId().toString(), request.toAccountId().toString(), amount.toPlainString(), desc);

            var old = transactions.existing(user, key, hash);
            if (old.isPresent()) return ResponseMapper.transaction(old.get(), user.getUserId());

            from.setBalance(from.getBalance().subtract(amount));
            to.setBalance(to.getBalance().add(amount));

            TransactionRecord t = new TransactionRecord();
            t.setInitiatedBy(user);
            t.setFromAccount(from);
            t.setToAccount(to);
            t.setAmount(amount);
            t.setTransactionType("TRANSFER");
            t.setStatus("COMPLETED");
            t.setDescription(desc);
            t.setIdempotencyKey(key);
            t.setRequestFingerprint(hash);
            LocalDateTime now = LocalDateTime.now(clock);
            t.setCreatedAt(now);
            t.setCompletedAt(now);
            t = records.save(t);

            audit.record(user, "TRANSFER_INITIATED", "TransactionRecord", t.getTransactionId());
            audit.record(user, "TRANSFER_SUCCESS", "TransactionRecord", t.getTransactionId());
            notifications.createNotification(user.getUserId(), "TRANSFER_SUCCESS", "Banking operation completed", "Transfer #" + t.getTransactionId() + " completed for LKR " + amount.toPlainString() + ".");

            return ResponseMapper.transaction(t, user.getUserId());
        }

        // 2. SAVED BENEFICIARY TRANSFER
        if (request.beneficiaryId() != null) {
            Beneficiary beneficiary = beneficiaries.findByBeneficiaryIdAndCustomer_User_UserId(request.beneficiaryId(), user.getUserId()).orElseThrow(ResourceNotFoundException::new);
            BankRules.require(beneficiary.isActive(), "INVALID_BENEFICIARY", "Select an active beneficiary");

            Account to = null;
            boolean isOtherBank = isOtherBank(beneficiary.getBankName());
            if (!isOtherBank) {
                to = accounts.findByAccountNumber(beneficiary.getAccountNumber()).orElse(null);
            }

            if (to != null) {
                BankRules.active(to);
                BankRules.require(!from.getAccountId().equals(to.getAccountId()), "SAME_ACCOUNT", "Source and destination must differ");
            }
            java.math.BigDecimal fee = (to == null || isOtherBank) ? new java.math.BigDecimal("25.00") : java.math.BigDecimal.ZERO;
            java.math.BigDecimal totalRequired = amount.add(fee);
            BankRules.require(from.getBalance().compareTo(totalRequired) >= 0, "INSUFFICIENT_BALANCE", "Insufficient account balance for transfer and LKR 25.00 fee");

            String desc = remarkOrDesc != null ? remarkOrDesc : ("Transfer to " + beneficiary.getName());
            String hash = TransactionService.fingerprint("TRANSFER", request.accountId().toString(), request.beneficiaryId().toString(), amount.toPlainString(), desc);

            var old = transactions.existing(user, key, hash);
            if (old.isPresent()) return ResponseMapper.transaction(old.get(), user.getUserId());

            TransactionRecord t = transactions.createPending(user, from, to, amount, "TRANSFER", desc, key, hash);
            if (to == null) {
                t.setExternalBank(beneficiary.getBankName());
                t.setExternalAccountNumber(beneficiary.getAccountNumber());
                records.save(t);
            }
            otp.issue(t);
            audit.record(user, "TRANSFER_INITIATED", "TransactionRecord", t.getTransactionId());
            return ResponseMapper.transaction(t, user.getUserId());
        }

        // 3. OTHER ACCOUNTS TRANSFER (Direct bank & account details)
        if ((request.accountNumber() != null && !request.accountNumber().isBlank()) || (request.beneficiaryName() != null && !request.beneficiaryName().isBlank())) {
            String bank = (request.bankName() != null && !request.bankName().isBlank()) ? request.bankName().trim() : "Serendib Bank";
            String bName = (request.beneficiaryName() != null && !request.beneficiaryName().isBlank()) ? request.beneficiaryName().trim() : "Recipient";
            String accNum = (request.accountNumber() != null) ? request.accountNumber().trim() : "";
            Account to = null;
            boolean isOtherBank = isOtherBank(bank);
            if (!isOtherBank) {
                to = accounts.findByAccountNumber(accNum).orElse(null);
            }

            if (to != null) {
                BankRules.active(to);
                BankRules.require(!from.getAccountId().equals(to.getAccountId()), "SAME_ACCOUNT", "Source and destination must differ");
            }
            java.math.BigDecimal fee = (to == null || isOtherBank) ? new java.math.BigDecimal("25.00") : java.math.BigDecimal.ZERO;
            java.math.BigDecimal totalRequired = amount.add(fee);
            BankRules.require(from.getBalance().compareTo(totalRequired) >= 0, "INSUFFICIENT_BALANCE", "Insufficient account balance for transfer and LKR 25.00 fee");

            String desc = remarkOrDesc != null ? remarkOrDesc : ("Transfer to " + bName);
            String hash = TransactionService.fingerprint("TRANSFER", request.accountId().toString(), accNum, amount.toPlainString(), desc);

            var old = transactions.existing(user, key, hash);
            if (old.isPresent()) return ResponseMapper.transaction(old.get(), user.getUserId());

            TransactionRecord t = transactions.createPending(user, from, to, amount, "TRANSFER", desc, key, hash);
            if (to == null) {
                t.setExternalBank(bank);
                t.setExternalAccountNumber(accNum);
                records.save(t);
            }
            otp.issue(t);
            audit.record(user, "TRANSFER_INITIATED", "TransactionRecord", t.getTransactionId());
            return ResponseMapper.transaction(t, user.getUserId());
        }

        throw new BusinessRuleException("INVALID_TRANSFER", "Destination account, saved beneficiary, or bank details required");
    }
}
