package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.OtpRepository;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import java.time.*;
import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class OtpService {
    private final OtpRepository otps;
    private final PasswordEncoder encoder;
    private final OtpDeliveryService delivery;
    private final EmailService emailService;
    private final SmsService smsService;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();
    @Value("${bank.otp.ttl-seconds:180}")
    private int ttl;
    @Value("${bank.otp.max-attempts:5}")
    private int attempts;
    @Value("${bank.otp.resend-seconds:30}")
    private int cooldown;

    /**
     * Caller must hold the transaction row lock when replacing or checking a
     * challenge.
     */
    public void issue(TransactionRecord transaction) {
        LocalDateTime now = LocalDateTime.now(clock);
        BankRules.require(
                "PENDING".equals(transaction.getStatus()) && transaction.getAuthorizationExpiresAt().isAfter(now),
                "INVALID_STATE", "Authorization is no longer pending");
        Otp otp = otps.findByTransaction_TransactionId(transaction.getTransactionId()).orElseGet(Otp::new);
        BankRules.require(otp.getAttemptCount() < attempts, "OTP_LOCKED", "Maximum OTP attempts exceeded");
        BankRules.require(otp.getLastSentAt() == null || !otp.getLastSentAt().plusSeconds(cooldown).isAfter(now),
                "OTP_COOLDOWN", "Please wait before requesting another code");
        String code = String.format("%06d", random.nextInt(1_000_000));
        LocalDateTime expiry = now.plusSeconds(ttl).isBefore(transaction.getAuthorizationExpiresAt())
                ? now.plusSeconds(ttl)
                : transaction.getAuthorizationExpiresAt();
        otp.setTransaction(transaction);
        otp.setOtpHash(encoder.encode(code));
        otp.setCreatedAt(now);
        otp.setExpiresAt(expiry);
        otp.setLastSentAt(now);
        otp.setVerified(false);
        otp.setVerifiedAt(null);
        otps.save(otp);
        delivery.deliver(transaction.getTransactionId(), code, expiry);

        User user = transaction.getInitiatedBy();
        if (user == null && transaction.getFromAccount() != null
                && transaction.getFromAccount().getCustomer() != null) {
            user = transaction.getFromAccount().getCustomer().getUser();
        }
        if (emailService != null && user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
            String typeStr = transaction.getTransactionType() != null ? transaction.getTransactionType()
                    : "Monetary Transaction";
            String amtStr = transaction.getAmount() != null ? transaction.getAmount().toPlainString() : "0.00";
            emailService.sendOtpNotification(user.getEmail(), user.getUsername(), typeStr, amtStr, code);
        }
        if (smsService != null && user != null && user.getPhone() != null && !user.getPhone().isBlank()) {
            String typeStr = transaction.getTransactionType() != null ? transaction.getTransactionType()
                    : "Monetary Transaction";
            smsService.sendOtpSms(user.getPhone(), typeStr, code);
        }
    }

    /**
     * Returns a failure code rather than throwing, so the caller commits
     * failed-attempt counters.
     */
    public String check(TransactionRecord transaction, String code) {
        Otp o = otps.findByTransaction_TransactionId(transaction.getTransactionId())
                .orElseThrow(ResourceNotFoundException::new);
        if (o.isVerified())
            return "OTP_USED";
        if (o.getAttemptCount() >= attempts)
            return "OTP_LOCKED";
        if (!o.getExpiresAt().isAfter(LocalDateTime.now(clock)))
            return "OTP_EXPIRED";
        o.setAttemptCount(o.getAttemptCount() + 1);
        if (!encoder.matches(code, o.getOtpHash()))
            return o.getAttemptCount() >= attempts ? "OTP_LOCKED" : "OTP_INVALID";
        o.setVerified(true);
        o.setVerifiedAt(LocalDateTime.now(clock));
        delivery.remove(transaction.getTransactionId());
        return null;
    }
}
