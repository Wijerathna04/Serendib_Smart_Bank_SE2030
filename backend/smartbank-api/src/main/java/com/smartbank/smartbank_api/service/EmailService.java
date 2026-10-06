package com.smartbank.smartbank_api.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@Slf4j
public class EmailService {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final JavaMailSender mailSender;
    private final String mailUsername;
    private final String fromEmail;
    private final String fromName;
    private final Clock clock;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${spring.mail.username:wijerathna.dev.2004@gmail.com}") String mailUsername,
            @Value("${mail.from-email:wijerathna.dev.2004@gmail.com}") String fromEmail,
            @Value("${mail.from-name:Serendib Smart Bank}") String fromName,
            Clock clock) {
        this.mailSender = mailSender;
        this.mailUsername = mailUsername != null ? mailUsername.trim() : "";
        this.fromEmail = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "wijerathna.dev.2004@gmail.com";
        this.fromName = (fromName != null && !fromName.isBlank()) ? fromName.trim() : "Serendib Smart Bank";
        this.clock = clock;
    }

    public void sendLoginNotification(String recipientEmail, String username, String ipAddress) {
        if (!isValidEmail(recipientEmail)) return;
        String timeStr = LocalDateTime.now(clock).format(FORMATTER);
        String subject = "Security Alert: Successful Sign-In to Serendib Smart Bank";
        String ipInfo = (ipAddress != null && !ipAddress.isBlank()) ? ipAddress : "Unknown IP";

        String textPart = String.format(
            "Dear %s,\n\nYour Serendib Smart Bank account was accessed on %s (IP: %s).\n\nIf you did not perform this login, please contact customer support immediately.\n\nSerendib Smart Bank Security Team",
            username, timeStr, ipInfo
        );

        String htmlPart = String.format(
            "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #10B981;border-radius:12px;background:#0A192F;color:#ffffff;\">" +
            "<h2 style=\"color:#10B981;margin-top:0;\">Serendib Smart Bank</h2>" +
            "<h3 style=\"color:#ffffff;\">Security Alert: Successful Sign-In</h3>" +
            "<p>Dear <strong>%s</strong>,</p>" +
            "<p>We detected a successful sign-in to your account with the following details:</p>" +
            "<ul style=\"line-height:1.8;color:#e2e8f0;\">" +
            "<li><strong>Time:</strong> %s</li>" +
            "<li><strong>IP Address:</strong> %s</li>" +
            "<li><strong>Account:</strong> %s</li>" +
            "</ul>" +
            "<p style=\"color:#94a3b8;font-size:13px;\">If this was you, you can safely ignore this email. If you did not sign in, please secure your account immediately.</p>" +
            "<hr style=\"border:0;border-top:1px solid #10B981;margin:20px 0;\">" +
            "<small style=\"color:#64748b;\">Serendib Smart Bank &copy; 2026. Academic Simulation.</small>" +
            "</div>",
            escapeHtml(username), timeStr, escapeHtml(ipInfo), escapeHtml(username)
        );

        dispatchAsync(recipientEmail.trim(), username, subject, textPart, htmlPart);
    }

    public void sendLogoutNotification(String recipientEmail, String username) {
        if (!isValidEmail(recipientEmail)) return;
        String timeStr = LocalDateTime.now(clock).format(FORMATTER);
        String subject = "Security Notification: Signed Out of Serendib Smart Bank";

        String textPart = String.format(
            "Dear %s,\n\nYou have successfully signed out of your Serendib Smart Bank account on %s.\n\nThank you for banking with Serendib Smart Bank.\n\nSerendib Smart Bank Security Team",
            username, timeStr
        );

        String htmlPart = String.format(
            "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #10B981;border-radius:12px;background:#0A192F;color:#ffffff;\">" +
            "<h2 style=\"color:#10B981;margin-top:0;\">Serendib Smart Bank</h2>" +
            "<h3 style=\"color:#ffffff;\">Security Notification: Signed Out</h3>" +
            "<p>Dear <strong>%s</strong>,</p>" +
            "<p>You have signed out of your session on <strong>%s</strong>.</p>" +
            "<p style=\"color:#94a3b8;font-size:13px;\">If you did not initiate this sign-out, please sign in to check your account activity.</p>" +
            "<hr style=\"border:0;border-top:1px solid #10B981;margin:20px 0;\">" +
            "<small style=\"color:#64748b;\">Serendib Smart Bank &copy; 2026. Academic Simulation.</small>" +
            "</div>",
            escapeHtml(username), timeStr
        );

        dispatchAsync(recipientEmail.trim(), username, subject, textPart, htmlPart);
    }

    public void sendOtpNotification(String recipientEmail, String username, String transactionType, String amount, String otpCode) {
        if (!isValidEmail(recipientEmail)) return;
        String timeStr = LocalDateTime.now(clock).format(FORMATTER);
        String typeLabel = transactionType != null ? transactionType : "Transaction";
        String amtLabel = amount != null ? amount : "0.00";
        String subject = "Serendib Smart Bank: Verification Code (OTP) for " + typeLabel;

        String textPart = String.format(
            "Dear %s,\n\nYour One-Time Password (OTP) for %s (Amount: LKR %s) is: %s\n\nThis OTP is valid for 3 minutes. Never share this OTP with anyone.\n\nSerendib Smart Bank Security Team",
            username, typeLabel, amtLabel, otpCode
        );

        String htmlPart = String.format(
            "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #10B981;border-radius:12px;background:#0A192F;color:#ffffff;\">" +
            "<h2 style=\"color:#10B981;margin-top:0;\">Serendib Smart Bank</h2>" +
            "<h3 style=\"color:#ffffff;\">Transaction Verification Code (OTP)</h3>" +
            "<p>Dear <strong>%s</strong>,</p>" +
            "<p>You initiated a <strong>%s</strong> for <strong>LKR %s</strong> on %s.</p>" +
            "<div style=\"background:#10B981;color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:6px;text-align:center;padding:16px;border-radius:8px;margin:20px 0;\">%s</div>" +
            "<p style=\"color:#f59e0b;font-weight:600;\">⚠️ This code is valid for 3 minutes. Do NOT disclose this OTP to anyone.</p>" +
            "<hr style=\"border:0;border-top:1px solid #10B981;margin:20px 0;\">" +
            "<small style=\"color:#64748b;\">Serendib Smart Bank &copy; 2026. Academic Simulation.</small>" +
            "</div>",
            escapeHtml(username), escapeHtml(typeLabel), escapeHtml(amtLabel), timeStr, escapeHtml(otpCode)
        );

        dispatchAsync(recipientEmail.trim(), username, subject, textPart, htmlPart);
    }

    public void sendNotificationEmail(String recipientEmail, String username, String title, String message) {
        if (!isValidEmail(recipientEmail)) return;
        String timeStr = LocalDateTime.now(clock).format(FORMATTER);
        String subject = "Serendib Notification: " + (title != null ? title : "Account Alert");

        String textPart = String.format(
            "Dear %s,\n\n%s\n\n%s\n\nDate: %s\n\nSerendib Smart Bank Notification Team",
            username, title != null ? title : "Notification", message != null ? message : "", timeStr
        );

        String htmlPart = String.format(
            "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #3B82F6;border-radius:12px;background:#0A192F;color:#ffffff;\">" +
            "<h2 style=\"color:#3B82F6;margin-top:0;\">Serendib Smart Bank</h2>" +
            "<h3 style=\"color:#ffffff;\">%s</h3>" +
            "<p>Dear <strong>%s</strong>,</p>" +
            "<p style=\"font-size:15px;line-height:1.6;color:#e2e8f0;\">%s</p>" +
            "<p style=\"color:#94a3b8;font-size:12px;margin-top:16px;\">Received at: %s</p>" +
            "<hr style=\"border:0;border-top:1px solid #3B82F6;margin:20px 0;\">" +
            "<small style=\"color:#64748b;\">Serendib Smart Bank &copy; 2026. Online Banking Notification System.</small>" +
            "</div>",
            escapeHtml(title), escapeHtml(username), escapeHtml(message), timeStr
        );

        dispatchAsync(recipientEmail.trim(), username, subject, textPart, htmlPart);
    }

    public void sendNotificationEmailWithAttachment(String recipientEmail, String username, String title, String message, byte[] attachment, String filename) {
        if (!isValidEmail(recipientEmail)) return;
        String timeStr = LocalDateTime.now(clock).format(FORMATTER);
        String subject = "Serendib Statement: " + (title != null ? title : "Monthly Statement");

        String textPart = String.format(
            "Dear %s,\n\n%s\n\n%s\n\nDate: %s\n\nSerendib Smart Bank Notification Team",
            username, title != null ? title : "Monthly Statement", message != null ? message : "", timeStr
        );

        String htmlPart = String.format(
            "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #3B82F6;border-radius:12px;background:#0A192F;color:#ffffff;\">" +
            "<h2 style=\"color:#3B82F6;margin-top:0;\">Serendib Smart Bank</h2>" +
            "<h3 style=\"color:#ffffff;\">%s</h3>" +
            "<p>Dear <strong>%s</strong>,</p>" +
            "<p style=\"font-size:15px;line-height:1.6;color:#e2e8f0;\">%s</p>" +
            "<p style=\"color:#94a3b8;font-size:12px;margin-top:16px;\">Received at: %s</p>" +
            "<hr style=\"border:0;border-top:1px solid #3B82F6;margin:20px 0;\">" +
            "<small style=\"color:#64748b;\">Serendib Smart Bank &copy; 2026. Online Banking Notification System.</small>" +
            "</div>",
            escapeHtml(title), escapeHtml(username), escapeHtml(message), timeStr
        );

        CompletableFuture.runAsync(() -> {
            try {
                if (mailSender == null) {
                    log.info("JavaMailSender is not configured. Logging email with attachment content locally for {}:\n{}", recipientEmail, textPart);
                    return;
                }
                MimeMessage msg = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
                helper.setFrom(fromEmail, fromName);
                helper.setTo(recipientEmail.trim());
                helper.setSubject(subject);
                helper.setText(textPart, htmlPart);
                if (attachment != null && attachment.length > 0) {
                    helper.addAttachment(filename != null ? filename : "statement.pdf", new org.springframework.core.io.ByteArrayResource(attachment));
                }
                mailSender.send(msg);
                log.info("Email with PDF attachment delivered successfully to {}", recipientEmail);
            } catch (Exception e) {
                log.error("Failed to dispatch email with attachment to {}: {}", recipientEmail, e.getMessage());
            }
        }, executor);
    }

    private void dispatchAsync(String recipientEmail, String recipientName, String subject, String textPart, String htmlPart) {
        log.info("Sending Email to [{}] via Google SMTP | Subject: {}", recipientEmail, subject);
        CompletableFuture.runAsync(() -> {
            try {
                if (mailSender == null) {
                    log.info("JavaMailSender is not configured. Logging email content locally for {}:\n{}", recipientEmail, textPart);
                    return;
                }
                sendSmtpEmail(recipientEmail, recipientName, subject, textPart, htmlPart);
            } catch (Exception e) {
                log.error("Failed to dispatch email via Google SMTP to {}: {}. Outputting to server logs as fallback:\n{}", recipientEmail, e.getMessage(), textPart);
            }
        }, executor);
    }

    protected void sendSmtpEmail(String recipientEmail, String recipientName, String subject, String textPart, String htmlPart) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, fromName);
        helper.setTo(recipientEmail);
        helper.setSubject(subject);
        helper.setText(textPart, htmlPart);

        mailSender.send(message);
        log.info("Google SMTP email notification delivered successfully to {}", recipientEmail);
    }

    public boolean isConfigured() {
        return mailSender != null;
    }

    public String getProviderName() {
        return mailSender != null ? "SMTP" : "SIMULATED";
    }

    private boolean isValidEmail(String email) {
        if (email == null) return false;
        String trimmed = email.trim();
        return trimmed.contains("@") && trimmed.indexOf('@') > 0 && trimmed.indexOf('@') < trimmed.length() - 1;
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
