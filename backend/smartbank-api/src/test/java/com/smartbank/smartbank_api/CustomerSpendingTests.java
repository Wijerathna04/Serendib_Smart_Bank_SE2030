package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.dto.BankResponses.SpendingCategoryView;
import com.smartbank.smartbank_api.dto.BankResponses.SpendingSummaryView;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.service.CurrentUserService;
import com.smartbank.smartbank_api.service.CustomerSpendingService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class CustomerSpendingTests {

    @Autowired private CustomerSpendingService spendingService;
    @Autowired private CurrentUserService currentUserService;
    @Autowired private TransactionRecordRepository transactions;
    @Autowired private AccountRepository accounts;
    @Autowired private CustomerRepository customers;
    @Autowired private UserRepository users;
    @Autowired private RoleRepository roles;

    private User createTestUser(String username, String roleName) {
        Role role = roles.findByRoleNameIgnoreCase(roleName).orElseGet(() -> {
            Role r = new Role();
            r.setRoleName("ROLE_" + roleName.toUpperCase());
            return roles.save(r);
        });
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@example.invalid");
        user.setPasswordHash("hash");
        user.setStatus("ACTIVE");
        user.setRole(role);
        return users.save(user);
    }

    private Customer createTestCustomer(User user) {
        Customer c = new Customer();
        c.setUser(user);
        return customers.save(c);
    }

    private Account createTestAccount(Customer customer, String accNo) {
        Account a = new Account();
        a.setCustomer(customer);
        a.setAccountNumber(accNo);
        a.setAccountType("SAVINGS");
        a.setStatus("ACTIVE");
        a.setBalance(new BigDecimal("10000.00"));
        return accounts.save(a);
    }

    private void authenticateAs(User user) {
        String role = user.getRole().getRoleName();
        if (!role.startsWith("ROLE_")) role = "ROLE_" + role.toUpperCase();
        var auth = new UsernamePasswordAuthenticationToken(user.getUsername(), null, List.of(new SimpleGrantedAuthority(role)));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @WithMockUser(username = "emp_spend_test", roles = "EMPLOYEE")
    void employeeTokenGets403() {
        assertThrows(AccessDeniedException.class, () -> spendingService.getSpendingSummary());
    }

    @Test
    void emptyMonthReturnsZerosAnd100PercentSum() {
        String suffix = UUID.randomUUID().toString().substring(0, 6);
        User user = createTestUser("c_empty_" + suffix, "CUSTOMER");
        createTestCustomer(user);

        authenticateAs(user);

        try {
            SpendingSummaryView summary = spendingService.getSpendingSummary();
            assertNotNull(summary);
            assertEquals("LKR", summary.currency());
            assertEquals("0.00", summary.total());
            assertEquals(5, summary.categories().size());

            int sumPct = 0;
            for (SpendingCategoryView cat : summary.categories()) {
                assertEquals("0.00", cat.amount());
                assertEquals(0, cat.count());
                assertEquals(0, cat.percent());
                sumPct += cat.percent();
            }
            assertEquals(0, sumPct);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    void twoCustomersGetDifferentResultsAndExclusionsWork() {
        String s1 = UUID.randomUUID().toString().substring(0, 6);
        String s2 = UUID.randomUUID().toString().substring(0, 6);

        User u1 = createTestUser("cust1_" + s1, "CUSTOMER");
        Customer c1 = createTestCustomer(u1);
        Account a1_1 = createTestAccount(c1, "acc1_1_" + s1);
        Account a1_2 = createTestAccount(c1, "acc1_2_" + s1);

        User u2 = createTestUser("cust2_" + s2, "CUSTOMER");
        Customer c2 = createTestCustomer(u2);
        Account a2 = createTestAccount(c2, "acc2_" + s2);

        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Colombo"));

        // 1. BILL_PAYMENT for Customer 1 (Completed) -> 5000.00
        TransactionRecord t1 = new TransactionRecord();
        t1.setInitiatedBy(u1);
        t1.setFromAccount(a1_1);
        t1.setTransactionType("BILL_PAYMENT");
        t1.setAmount(new BigDecimal("5000.00"));
        t1.setStatus("COMPLETED");
        t1.setCreatedAt(now);
        transactions.save(t1);

        // 2. Transfer from Customer 1 to Customer 2 (Completed) -> 3000.00
        TransactionRecord t2 = new TransactionRecord();
        t2.setInitiatedBy(u1);
        t2.setFromAccount(a1_1);
        t2.setToAccount(a2);
        t2.setTransactionType("TRANSFER");
        t2.setAmount(new BigDecimal("3000.00"));
        t2.setStatus("COMPLETED");
        t2.setCreatedAt(now);
        transactions.save(t2);

        // 3. Own-account transfer (Customer 1 a1_1 -> Customer 1 a1_2) (Completed) -> SHOULD BE EXCLUDED
        TransactionRecord tOwn = new TransactionRecord();
        tOwn.setInitiatedBy(u1);
        tOwn.setFromAccount(a1_1);
        tOwn.setToAccount(a1_2);
        tOwn.setTransactionType("TRANSFER");
        tOwn.setAmount(new BigDecimal("2000.00"));
        tOwn.setStatus("COMPLETED");
        tOwn.setCreatedAt(now);
        transactions.save(tOwn);

        // 4. Pending transaction for Customer 1 -> SHOULD BE EXCLUDED
        TransactionRecord tPending = new TransactionRecord();
        tPending.setInitiatedBy(u1);
        tPending.setFromAccount(a1_1);
        tPending.setTransactionType("BILL_PAYMENT");
        tPending.setAmount(new BigDecimal("1000.00"));
        tPending.setStatus("PENDING");
        tPending.setCreatedAt(now);
        transactions.save(tPending);

        // 5. Failed transaction for Customer 1 -> SHOULD BE EXCLUDED
        TransactionRecord tFailed = new TransactionRecord();
        tFailed.setInitiatedBy(u1);
        tFailed.setFromAccount(a1_1);
        tFailed.setTransactionType("CARD_PAYMENT");
        tFailed.setAmount(new BigDecimal("1500.00"));
        tFailed.setStatus("FAILED");
        tFailed.setCreatedAt(now);
        transactions.save(tFailed);

        // 6. Card purchase for Customer 2 -> 2000.00
        TransactionRecord tCustomer2 = new TransactionRecord();
        tCustomer2.setInitiatedBy(u2);
        tCustomer2.setFromAccount(a2);
        tCustomer2.setTransactionType("CARD_PURCHASE");
        tCustomer2.setAmount(new BigDecimal("2000.00"));
        tCustomer2.setStatus("COMPLETED");
        tCustomer2.setCreatedAt(now);
        transactions.save(tCustomer2);

        transactions.flush();

        // Check Customer 1
        authenticateAs(u1);

        try {
            SpendingSummaryView sum1 = spendingService.getSpendingSummary();
            assertEquals("8000.00", sum1.total()); // 5000 + 3000 (own account, pending, failed excluded)

            int totalPct = 0;
            for (SpendingCategoryView cat : sum1.categories()) {
                totalPct += cat.percent();
                if ("UTILITY_BILLS".equals(cat.key())) {
                    assertEquals("5000.00", cat.amount());
                    assertEquals(63, cat.percent()); // 5000/8000 = 62.5% -> 63% with largest remainder
                } else if ("MONEY_TRANSFERS".equals(cat.key())) {
                    assertEquals("3000.00", cat.amount());
                    assertEquals(37, cat.percent()); // 3000/8000 = 37.5% -> 37% (62.5% got 63% with largest remainder)
                }
            }
            assertEquals(100, totalPct); // Percentages sum to 100!
        } finally {
            SecurityContextHolder.clearContext();
        }

        // Check Customer 2
        authenticateAs(u2);

        try {
            SpendingSummaryView sum2 = spendingService.getSpendingSummary();
            assertEquals("2000.00", sum2.total()); // Customer 2 has 2000.00
            for (SpendingCategoryView cat : sum2.categories()) {
                if ("CARD_PURCHASES".equals(cat.key())) {
                    assertEquals("2000.00", cat.amount());
                    assertEquals(100, cat.percent());
                } else {
                    assertEquals("0.00", cat.amount());
                    assertEquals(0, cat.percent());
                }
            }
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    void fixedClockMonthBoundaryTest() {
        // Test that a transaction on 2026-10-31T23:59:00 counts in October
        // and one on 2026-11-01T00:00:00 counts in November.
        String suffix = UUID.randomUUID().toString().substring(0, 6);
        User u = createTestUser("cust_boundary_" + suffix, "CUSTOMER");
        Customer c = createTestCustomer(u);
        Account a = createTestAccount(c, "acc_boundary_" + suffix);

        // Transaction in October
        LocalDateTime octTime = LocalDateTime.of(2026, 10, 31, 23, 59, 0);
        TransactionRecord octTxn = new TransactionRecord();
        octTxn.setInitiatedBy(u);
        octTxn.setFromAccount(a);
        octTxn.setTransactionType("BILL_PAYMENT");
        octTxn.setAmount(new BigDecimal("1200.00"));
        octTxn.setStatus("COMPLETED");
        octTxn.setCreatedAt(octTime);
        transactions.save(octTxn);

        // Transaction in November
        LocalDateTime novTime = LocalDateTime.of(2026, 11, 1, 0, 0, 0);
        TransactionRecord novTxn = new TransactionRecord();
        novTxn.setInitiatedBy(u);
        novTxn.setFromAccount(a);
        novTxn.setTransactionType("CARD_PAYMENT");
        novTxn.setAmount(new BigDecimal("3400.00"));
        novTxn.setStatus("COMPLETED");
        novTxn.setCreatedAt(novTime);
        transactions.save(novTxn);

        transactions.flush();

        // 1. Create service with fixed clock at 2026-10-31T23:59:30 in Colombo (+05:30)
        Instant octInstant = ZonedDateTime.of(2026, 10, 31, 23, 59, 30, 0, ZoneId.of("Asia/Colombo")).toInstant();
        Clock octClock = Clock.fixed(octInstant, ZoneId.of("Asia/Colombo"));

        CustomerSpendingService octSpendingService = new CustomerSpendingService(currentUserService, transactions, octClock);

        authenticateAs(u);

        try {
            SpendingSummaryView octSummary = octSpendingService.getSpendingSummary();
            assertEquals("2026-10", octSummary.monthKey());
            assertEquals("October 2026", octSummary.monthLabel());
            assertEquals("1200.00", octSummary.total()); // Only October txn

            // 2. Create service with fixed clock at 2026-11-01T10:00:00 in Colombo (+05:30)
            Instant novInstant = ZonedDateTime.of(2026, 11, 1, 10, 0, 0, 0, ZoneId.of("Asia/Colombo")).toInstant();
            Clock novClock = Clock.fixed(novInstant, ZoneId.of("Asia/Colombo"));

            CustomerSpendingService novSpendingService = new CustomerSpendingService(currentUserService, transactions, novClock);
            SpendingSummaryView novSummary = novSpendingService.getSpendingSummary();
            assertEquals("2026-11", novSummary.monthKey());
            assertEquals("November 2026", novSummary.monthLabel());
            assertEquals("3400.00", novSummary.total()); // October txn reset; only November txn
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
