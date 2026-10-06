package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.dto.BankRequests.Transfer;
import com.smartbank.smartbank_api.dto.BankResponses.TransactionView;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TransferServiceTests {

    private CurrentUserService current;
    private AccountRepository accounts;
    private BeneficiaryRepository beneficiaries;
    private TransactionRecordRepository records;
    private TransactionService transactions;
    private OtpService otp;
    private AuditLogService audit;
    private NotificationService notifications;
    private Clock clock;

    private TransferService service;

    private User user;
    private Account fromAccount;
    private Account toAccount;

    @BeforeEach
    void setUp() {
        current = mock(CurrentUserService.class);
        accounts = mock(AccountRepository.class);
        beneficiaries = mock(BeneficiaryRepository.class);
        records = mock(TransactionRecordRepository.class);
        transactions = mock(TransactionService.class);
        otp = mock(OtpService.class);
        audit = mock(AuditLogService.class);
        notifications = mock(NotificationService.class);
        clock = Clock.fixed(Instant.parse("2026-10-03T12:00:00Z"), ZoneId.of("UTC"));

        service = new TransferService(current, accounts, beneficiaries, records, transactions, otp, audit, notifications, clock);

        user = new User();
        user.setUserId(1);
        user.setUsername("test_user");

        fromAccount = new Account();
        fromAccount.setAccountId(10);
        fromAccount.setAccountNumber("1000000001");
        fromAccount.setStatus("ACTIVE");
        fromAccount.setBalance(new BigDecimal("5000.00"));

        toAccount = new Account();
        toAccount.setAccountId(20);
        toAccount.setAccountNumber("1000000002");
        toAccount.setStatus("ACTIVE");
        toAccount.setBalance(new BigDecimal("1000.00"));

        when(current.requireUser()).thenReturn(user);
        when(current.requireOwnedAccount(10)).thenReturn(fromAccount);
        when(current.requireOwnedAccount(20)).thenReturn(toAccount);
    }

    @Test
    void ownAccountTransferExecutesImmediatelyWithoutOtp() {
        Transfer req = new Transfer(10, null, 20, null, null, null, new BigDecimal("500.00"), null, "Own test");
        when(records.save(any())).thenAnswer(inv -> {
            TransactionRecord t = inv.getArgument(0);
            t.setTransactionId(99);
            return t;
        });

        TransactionView view = service.initiate(req, "idempotency-key-12345");

        assertEquals("COMPLETED", view.status());
        assertEquals(new BigDecimal("4500.00"), fromAccount.getBalance());
        assertEquals(new BigDecimal("1500.00"), toAccount.getBalance());
        verifyNoInteractions(otp);
        verify(notifications).createNotification(eq(1), eq("TRANSFER_SUCCESS"), anyString(), anyString());
    }

    @Test
    void otherAccountsTransferCreatesPendingTransactionAndIssuesOtp() {
        Transfer req = new Transfer(10, null, null, "Commercial Bank", "Jane Smith", "987654321", new BigDecimal("300.00"), null, "Payment");
        TransactionRecord pending = new TransactionRecord();
        pending.setTransactionId(101);
        pending.setStatus("PENDING");
        pending.setFromAccount(fromAccount);

        when(transactions.createPending(any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(pending);

        TransactionView view = service.initiate(req, "idempotency-key-67890");

        assertEquals("PENDING", view.status());
        verify(otp).issue(pending);
    }
}
