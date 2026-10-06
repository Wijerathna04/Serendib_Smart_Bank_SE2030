package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.service.EmailService;
import org.junit.jupiter.api.Test;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import static org.junit.jupiter.api.Assertions.*;

class EmailServiceTests {
    private final Clock fixedClock = Clock.fixed(Instant.parse("2026-10-03T10:15:30Z"), ZoneId.of("Asia/Colombo"));

    @Test
    void serviceConstructsAndHandlesNullMailSenderGracefully() {
        var service = new EmailService(null, "wijerathna.dev.2004@gmail.com", "wijerathna.dev.2004@gmail.com", "Serendib Smart Bank", fixedClock);
        assertDoesNotThrow(() -> service.sendLoginNotification("customer@test.com", "john_customer", "127.0.0.1"));
        assertDoesNotThrow(() -> service.sendLogoutNotification("customer@test.com", "john_customer"));
        assertDoesNotThrow(() -> service.sendOtpNotification("customer@test.com", "john_customer", "Fund Transfer", "1500.00", "123456"));
        assertDoesNotThrow(() -> service.sendNotificationEmail("customer@test.com", "john_customer", "Account Alert", "Test notification message"));
    }

    @Test
    void serviceIgnoresInvalidEmailsWithoutThrowing() {
        var service = new EmailService(null, "wijerathna.dev.2004@gmail.com", "wijerathna.dev.2004@gmail.com", "Serendib Smart Bank", fixedClock);
        assertDoesNotThrow(() -> service.sendLoginNotification(null, "john_customer", "127.0.0.1"));
        assertDoesNotThrow(() -> service.sendLoginNotification("notanemail", "john_customer", "127.0.0.1"));
        assertDoesNotThrow(() -> service.sendLogoutNotification("", "john_customer"));
    }

    @Test
    void serviceAcceptsValidEmailParameters() {
        var service = new EmailService(null, "wijerathna.dev.2004@gmail.com", "wijerathna.dev.2004@gmail.com", "Serendib Smart Bank", fixedClock);
        assertDoesNotThrow(() -> service.sendLoginNotification("customer@test.com", "john_customer", "192.168.1.1"));
        assertDoesNotThrow(() -> service.sendLogoutNotification("customer@test.com", "john_customer"));
    }
}
