package com.smartbank.smartbank_api;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.smartbank.smartbank_api.dto.BankRequests.LoanApplication;
import com.smartbank.smartbank_api.dto.BankRequests.Deposit;
import com.smartbank.smartbank_api.entity.Account;
import com.smartbank.smartbank_api.entity.Customer;
import com.smartbank.smartbank_api.entity.FixedDeposit;
import com.smartbank.smartbank_api.entity.Loan;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SafeJsonSerializationTests {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Clock clock = Clock.fixed(Instant.parse("2026-03-01T10:00:00Z"), ZoneId.of("Asia/Colombo"));

    private FixedDepositRepository deposits;
    private CurrentUserService current;
    private TransactionService transactions;
    private OtpService otp;
    private AuditLogService audit;
    private NotificationService notifications;
    private FixedDepositService fdService;

    private LoanRepository loans;
    private CustomerRepository customers;
    private UserRepository users;
    private RoleRepository roles;
    private LoanDecisionRepository decisions;
    private AccountRepository accounts;
    private TransactionRecordRepository records;
    private NumberingService numbering;
    private LoanService loanService;

    @BeforeEach
    void setUp() {
        deposits = mock(FixedDepositRepository.class);
        current = mock(CurrentUserService.class);
        transactions = mock(TransactionService.class);
        otp = mock(OtpService.class);
        audit = mock(AuditLogService.class);
        notifications = mock(NotificationService.class);

        fdService = new FixedDepositService(
            deposits, current, transactions, otp, audit, notifications, new com.smartbank.smartbank_api.config.FixedDepositProperties(), clock, objectMapper
        );

        loans = mock(LoanRepository.class);
        customers = mock(CustomerRepository.class);
        users = mock(UserRepository.class);
        roles = mock(RoleRepository.class);
        decisions = mock(LoanDecisionRepository.class);
        accounts = mock(AccountRepository.class);
        records = mock(TransactionRecordRepository.class);
        numbering = mock(NumberingService.class);

        loanService = new LoanService(
            loans, customers, users, roles, decisions, accounts, deposits, records,
            null, numbering, current, notifications, audit, clock, mock(RiskScoringService.class), mock(RiskAssessmentRepository.class)
        );
    }

    @Test
    void fdDetailsJsonHandlesSpecialCharactersAndExactKeys() throws Exception {
        User user = new User();
        user.setUserId(1);
        Account account = new Account();
        account.setAccountId(100);
        account.setStatus("ACTIVE");
        account.setBalance(new BigDecimal("50000.00"));

        when(current.requireUser()).thenReturn(user);
        when(current.requireOwnedAccount(100)).thenReturn(account);
        com.smartbank.smartbank_api.entity.TransactionRecord mockTxn = new com.smartbank.smartbank_api.entity.TransactionRecord();
        mockTxn.setTransactionId(10);
        when(transactions.createPending(any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(mockTxn);

        Deposit req = new Deposit(
            100,
            new BigDecimal("25000.00"),
            12,
            "Monthly \"Interest\"\nWith \\ Special",
            "Auto-Renew \"P&I\"\nLine 2 \\ test",
            true,
            false
        );

        fdService.create(req, "key");

        ArgumentCaptor<FixedDeposit> captor = ArgumentCaptor.forClass(FixedDeposit.class);
        verify(deposits).save(captor.capture());

        FixedDeposit savedFd = captor.getValue();
        assertNotNull(savedFd.getFdDetails());

        JsonNode json = objectMapper.readTree(savedFd.getFdDetails());
        assertTrue(json.has("payoutFrequency"));
        assertTrue(json.has("maturityInstruction"));
        assertTrue(json.has("fatca"));
        assertTrue(json.has("pep"));

        assertEquals("Monthly \"Interest\"\nWith \\ Special", json.get("payoutFrequency").asText());
        assertEquals("Auto-Renew \"P&I\"\nLine 2 \\ test", json.get("maturityInstruction").asText());
        assertTrue(json.get("fatca").asBoolean());
        assertFalse(json.get("pep").asBoolean());
    }

    @Test
    void loanScrutinyJsonHandlesSpecialCharactersAndExactKeys() throws Exception {
        User user = new User();
        user.setUserId(2);
        Customer customer = new Customer();
        customer.setCustomerId(5);
        customer.setUser(user);

        Account account = new Account();
        account.setAccountId(100);
        account.setStatus("ACTIVE");

        when(current.requireCustomer()).thenReturn(customer);
        when(accounts.findByCustomer_User_UserId(any(), any())).thenReturn(new org.springframework.data.domain.PageImpl<>(java.util.List.of(account)));
        when(numbering.generateLoanNumber(any())).thenReturn("LN-001");

        LoanApplication req = new LoanApplication(
            "PERSONAL",
            new BigDecimal("100000.00"),
            "Special \"Info\"\nWith \\ Slash",
            null,
            null,
            null,
            12,
            new BigDecimal("50000.00"),
            new BigDecimal("5000.00"),
            new BigDecimal("2000.00"),
            "Employed \"Full-Time\"\nSenior",
            5,
            "Good \"Condition\"\nLike New \\ Clean",
            2022,
            new BigDecimal("2500000.00"),
            "CH123\"456\"\nLine2 \\ test",
            "ENG987\"654\"\nLine2 \\ test",
            null,
            null,
            null
        );

        loanService.apply(req);

        ArgumentCaptor<Loan> captor = ArgumentCaptor.forClass(Loan.class);
        verify(loans).save(captor.capture());

        Loan savedLoan = captor.getValue();
        assertNotNull(savedLoan.getScrutinyData());

        JsonNode json = objectMapper.readTree(savedLoan.getScrutinyData());
        assertTrue(json.has("salary"));
        assertTrue(json.has("allowances"));
        assertTrue(json.has("crib"));
        assertTrue(json.has("employmentStatus"));
        assertTrue(json.has("serviceYears"));
        assertTrue(json.has("vehicleCondition"));
        assertTrue(json.has("manufactureYear"));
        assertTrue(json.has("valuation"));
        assertTrue(json.has("chassis"));
        assertTrue(json.has("engine"));

        assertEquals("Employed \"Full-Time\"\nSenior", json.get("employmentStatus").asText());
        assertEquals("Good \"Condition\"\nLike New \\ Clean", json.get("vehicleCondition").asText());
        assertEquals("CH123\"456\"\nLine2 \\ test", json.get("chassis").asText());
        assertEquals("ENG987\"654\"\nLine2 \\ test", json.get("engine").asText());
        assertEquals(50000.00, json.get("salary").asDouble(), 0.001);
    }
}
