package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.*;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Posting logic tests. Mock repositories do not prove database commit/rollback or locking. */
class TransactionPostingTests {
    private final Clock clock = Clock.fixed(Instant.parse("2026-09-20T00:00:00Z"), ZoneId.of("Asia/Colombo"));
    private TransactionService transactions;
    private AccountRepository accounts;
    private OtpService otp;
    private NotificationService notifications;
    private TransactionPostingService posting;
    private TransactionRecord transfer;
    private Account source;
    private Account destination;

    @BeforeEach void setUp() {
        transactions = mock(TransactionService.class);
        accounts = mock(AccountRepository.class);
        otp = mock(OtpService.class);
        notifications = mock(NotificationService.class);
        CurrentUserService current = mock(CurrentUserService.class);
        User owner = new User(); owner.setUserId(1);
        User recipient = new User(); recipient.setUserId(2);
        source = account(10, owner, "100.00");
        destination = account(20, recipient, "50.00");
        transfer = new TransactionRecord();
        transfer.setTransactionId(30); transfer.setInitiatedBy(owner);
        transfer.setTransactionType("TRANSFER"); transfer.setStatus("PENDING");
        transfer.setFromAccount(source); transfer.setToAccount(destination);
        transfer.setAmount(new BigDecimal("25.00"));
        transfer.setAuthorizationExpiresAt(LocalDateTime.now(clock).plusMinutes(10));
        when(current.requireUser()).thenReturn(owner);
        when(transactions.lockInitiated(30, 1)).thenReturn(transfer);
        when(accounts.lockById(10)).thenReturn(Optional.of(source));
        when(accounts.lockById(20)).thenReturn(Optional.of(destination));
        posting = new TransactionPostingService(transactions, mock(TransactionRecordRepository.class), accounts,
            mock(FixedDepositRepository.class), mock(BillPaymentRepository.class), current, otp,
            mock(OtpDeliveryService.class), notifications, mock(AuditLogService.class), clock);
    }

    @Test void successfulTransferConservesFundsAndLocksInOrder() {
        assertNull(posting.verify(30, "123456").errorCode());
        assertEquals(new BigDecimal("75.00"), source.getBalance());
        assertEquals(new BigDecimal("75.00"), destination.getBalance());
        assertEquals("COMPLETED", transfer.getStatus());
        var order = inOrder(accounts);
        order.verify(accounts).lockById(10);
        order.verify(accounts).lockById(20);
        verify(notifications).createNotification(eq(1), eq("TRANSFER_SUCCESS"), anyString(), anyString());
        verify(notifications).createNotification(eq(2), eq("TRANSFER_RECEIVED"), anyString(), anyString());
    }

    @Test void completedRetryDoesNotPostTwice() {
        posting.verify(30, "123456");
        posting.verify(30, "123456");
        assertEquals(new BigDecimal("75.00"), source.getBalance());
        assertEquals(new BigDecimal("75.00"), destination.getBalance());
        verify(otp, times(1)).check(transfer, "123456");
        verify(accounts, times(1)).lockById(10);
    }

    @Test void invalidOtpNeverLoadsBalancesForPosting() {
        when(otp.check(transfer, "000000")).thenReturn("OTP_INVALID");
        assertEquals("OTP_INVALID", posting.verify(30, "000000").errorCode());
        assertEquals("PENDING", transfer.getStatus());
        assertBalancesUnchanged();
        verifyNoInteractions(accounts, notifications);
    }

    @Test void insufficientFundsFailWithoutChangingEitherBalance() {
        transfer.setAmount(new BigDecimal("101.00"));
        assertEquals("INSUFFICIENT_BALANCE", posting.verify(30, "123456").errorCode());
        assertEquals("FAILED", transfer.getStatus());
        assertBalancesUnchanged();
        verify(notifications).createNotification(eq(1), eq("TRANSFER_FAILED"), anyString(), anyString());
    }

    @Test void inactiveDestinationFailsBeforeDebitingSource() {
        destination.setStatus("FROZEN");
        assertEquals("INACTIVE_ACCOUNT", posting.verify(30, "123456").errorCode());
        assertBalancesUnchanged();
    }

    @Test void destinationOverflowFailsBeforeDebitingSource() {
        destination.setBalance(BankRules.MAX_MONEY);
        assertEquals("BALANCE_LIMIT", posting.verify(30, "123456").errorCode());
        assertEquals(new BigDecimal("100.00"), source.getBalance());
        assertEquals(BankRules.MAX_MONEY, destination.getBalance());
    }

    @Test void expiredAuthorizationFailsBeforeOtpOrAccountAccess() {
        transfer.setAuthorizationExpiresAt(LocalDateTime.now(clock));
        assertEquals("AUTHORIZATION_EXPIRED", posting.verify(30, "123456").errorCode());
        assertBalancesUnchanged();
        verifyNoInteractions(otp, accounts);
    }

    @Test void cancellationIsIdempotentAndDoesNotMoveMoney() {
        posting.cancel(30);
        posting.cancel(30);
        assertEquals("CANCELLED", transfer.getStatus());
        assertBalancesUnchanged();
        verifyNoInteractions(otp, accounts);
        verify(notifications, times(1)).createNotification(eq(1), eq("TRANSFER_CANCELLED"), anyString(), anyString());
    }

    private void assertBalancesUnchanged() {
        assertEquals(new BigDecimal("100.00"), source.getBalance());
        assertEquals(new BigDecimal("50.00"), destination.getBalance());
    }
    private Account account(int id, User owner, String balance) {
        Customer customer = new Customer(); customer.setUser(owner);
        Account account = new Account(); account.setAccountId(id); account.setCustomer(customer);
        account.setBalance(new BigDecimal(balance)); account.setStatus("ACTIVE"); return account;
    }
}
