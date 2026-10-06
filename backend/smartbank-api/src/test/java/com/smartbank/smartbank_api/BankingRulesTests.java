package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.config.FixedDepositProperties;
import com.smartbank.smartbank_api.entity.Otp;
import com.smartbank.smartbank_api.entity.TransactionRecord;
import com.smartbank.smartbank_api.exception.BusinessRuleException;
import com.smartbank.smartbank_api.repository.OtpRepository;
import com.smartbank.smartbank_api.security.JwtService;
import com.smartbank.smartbank_api.security.TokenSessionService;
import com.smartbank.smartbank_api.service.BankRules;
import com.smartbank.smartbank_api.service.OtpDeliveryService;
import com.smartbank.smartbank_api.service.OtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.*;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Isolated rules/security tests: no Spring context, database, or external delivery. */
class BankingRulesTests {
    private final MutableClock clock = new MutableClock();
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private OtpRepository repository;
    private OtpDeliveryService delivery;
    private OtpService service;
    private TransactionRecord transaction;
    private Otp otp;

    @BeforeEach
    void setUp() {
        repository = mock(OtpRepository.class);
        delivery = mock(OtpDeliveryService.class);
        service = new OtpService(repository, encoder, delivery, null, null, clock);
        ReflectionTestUtils.setField(service, "ttl", 180);
        ReflectionTestUtils.setField(service, "attempts", 5);
        ReflectionTestUtils.setField(service, "cooldown", 30);
        transaction = new TransactionRecord();
        transaction.setTransactionId(1);
        transaction.setStatus("PENDING");
        transaction.setAuthorizationExpiresAt(LocalDateTime.now(clock).plusMinutes(10));
        otp = new Otp();
        otp.setOtpHash(encoder.encode("123456"));
        otp.setExpiresAt(LocalDateTime.now(clock).plusSeconds(180));
        when(repository.findByTransaction_TransactionId(1)).thenReturn(Optional.of(otp));
    }

    @Test void rejectsInvalidMoneyWithoutRounding() {
        for (String amount : new String[]{"0", "-1", "1.001", "10000000000.00"})
            assertThrows(BusinessRuleException.class, () -> BankRules.money(new BigDecimal(amount)));
        assertThrows(BusinessRuleException.class, () -> BankRules.money(null));
        assertEquals(new BigDecimal("1.20"), BankRules.money(new BigDecimal("1.200")));
        assertEquals(BankRules.MAX_MONEY, BankRules.money(BankRules.MAX_MONEY));
    }

    @Test void paginationIsBounded() {
        assertEquals(0, BankRules.page(-1, 1000, "id").getPageNumber());
        assertEquals(100, BankRules.page(0, 1000, "id").getPageSize());
        assertEquals(1, BankRules.page(0, -1, "id").getPageSize());
    }

    @Test void fixedDepositConfigurationRejectsUnsupportedRates() {
        FixedDepositProperties properties = new FixedDepositProperties();
        assertDoesNotThrow(properties::validate);
        properties.getRates().put(3, new BigDecimal("-1"));
        assertThrows(IllegalStateException.class, properties::validate);
    }

    @Test void passwordsAreSaltedAndVerified() {
        String first = encoder.encode("test-only-password");
        assertNotEquals(first, encoder.encode("test-only-password"));
        assertTrue(encoder.matches("test-only-password", first));
        assertFalse(encoder.matches("wrong", first));
    }

    @Test void invalidOtpConsumesAnAttempt() {
        assertEquals("OTP_INVALID", service.check(transaction, "654321"));
        assertEquals(1, otp.getAttemptCount());
        assertFalse(otp.isVerified());
        verifyNoInteractions(delivery);
    }

    @Test void fifthInvalidOtpLocksChallenge() {
        otp.setAttemptCount(4);
        assertEquals("OTP_LOCKED", service.check(transaction, "654321"));
        assertEquals("OTP_LOCKED", service.check(transaction, "123456"));
        assertEquals(5, otp.getAttemptCount());
    }

    @Test void expiryBoundaryRejectsCorrectOtp() {
        clock.advance(Duration.ofSeconds(180));
        assertEquals("OTP_EXPIRED", service.check(transaction, "123456"));
        assertEquals(0, otp.getAttemptCount());
    }

    @Test void validOtpCannotBeReused() {
        assertNull(service.check(transaction, "123456"));
        assertTrue(otp.isVerified());
        assertEquals("OTP_USED", service.check(transaction, "123456"));
        verify(delivery).remove(1);
    }

    @Test void resendPreservesAttemptCountAndHashesCode() {
        otp.setAttemptCount(2);
        service.issue(transaction);
        assertEquals(2, otp.getAttemptCount());
        assertNotEquals("123456", otp.getOtpHash());
        verify(delivery).deliver(eq(1), matches("[0-9]{6}"), eq(otp.getExpiresAt()));
        assertThrows(BusinessRuleException.class, () -> service.issue(transaction));
        verify(repository, times(1)).save(otp);
    }

    @Test void lockedOtpCannotBeResetByResend() {
        otp.setAttemptCount(5);
        assertThrows(BusinessRuleException.class, () -> service.issue(transaction));
        verify(repository, never()).save(any());
        verifyNoInteractions(delivery);
    }

    @Test void sessionExpiresAtIdleBoundaryWithoutPollingExtension() {
        TokenSessionService sessions = new TokenSessionService(clock, 10);
        sessions.register("id", "user", clock.instant().plusSeconds(3600));
        clock.advance(Duration.ofMinutes(9));
        assertTrue(sessions.valid("id", "user"));
        clock.advance(Duration.ofMinutes(1));
        assertFalse(sessions.valid("id", "user"));
    }

    @Test void activityExtendsIdleButNotAbsoluteExpiry() {
        TokenSessionService sessions = new TokenSessionService(clock, 10);
        sessions.register("id", "user", clock.instant().plusSeconds(900));
        clock.advance(Duration.ofMinutes(9));
        assertTrue(sessions.activity("id", "user"));
        clock.advance(Duration.ofMinutes(6));
        assertFalse(sessions.valid("id", "user"));
    }

    @Test void logoutAndUserRevocationInvalidateTokens() {
        TokenSessionService sessions = new TokenSessionService(clock, 10);
        JwtService jwt = new JwtService("isolated-test-signing-key-at-least-32-bytes", 24, clock, sessions);
        String first = jwt.generateToken("user");
        String second = jwt.generateToken("user");
        assertTrue(jwt.validateToken(first, "user"));
        sessions.revoke(jwt.claims(first).getId());
        assertFalse(jwt.validateToken(first, "user"));
        assertTrue(jwt.validateToken(second, "user"));
        sessions.revokeUser("user");
        assertFalse(jwt.validateToken(second, "user"));
    }

    @Test void jwtRejectsWrongSubjectMalformedAndForeignSignature() {
        TokenSessionService sessions = new TokenSessionService(clock, 10);
        JwtService jwt = new JwtService("isolated-test-signing-key-at-least-32-bytes", 24, clock, sessions);
        JwtService other = new JwtService("different-test-signing-key-at-least-32-bytes", 24, clock, sessions);
        assertFalse(jwt.validateToken(jwt.generateToken("user"), "other"));
        assertFalse(jwt.validateToken("not-a-token", "user"));
        assertFalse(jwt.validateToken(other.generateToken("user"), "user"));
    }

    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-09-20T00:00:00Z");
        void advance(Duration duration) { now = now.plus(duration); }
        public ZoneId getZone() { return ZoneId.of("Asia/Colombo"); }
        public Clock withZone(ZoneId zone) { return Clock.fixed(now, zone); }
        public Instant instant() { return now; }
    }
}
