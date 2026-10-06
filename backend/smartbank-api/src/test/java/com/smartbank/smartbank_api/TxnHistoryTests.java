package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class TxnHistoryTests {
    @Autowired TransactionRecordRepository transactions;
    @Autowired BillPaymentRepository billPayments;
    @Autowired AccountRepository accounts;
    @Autowired CustomerRepository customers;
    @Autowired UserRepository users;
    @Autowired RoleRepository roles;

    @Test void optionalSearchAndSingleEndedTransactionsRemainVisibleOnlyToOwner() {
        String suffix = java.util.UUID.randomUUID().toString().substring(0, 8);
        Role role = roles.findByRoleNameIgnoreCase("Customer").orElseThrow();
        User user = new User(); user.setUsername("history_" + suffix); user.setEmail(suffix + "@example.invalid");
        user.setPasswordHash("unused-integration-fixture"); user.setStatus("ACTIVE"); user.setRole(role); users.save(user);
        Customer customer = new Customer(); customer.setUser(user); customers.save(customer);
        Account account = new Account(); account.setCustomer(customer); account.setAccountNumber("history-" + suffix);
        account.setAccountType("SAVINGS"); account.setStatus("ACTIVE"); account.setBalance(new BigDecimal("100.00")); accounts.save(account);

        Account account2 = new Account(); account2.setCustomer(customer); account2.setAccountNumber("history2-" + suffix);
        account2.setAccountType("SAVINGS"); account2.setStatus("ACTIVE"); account2.setBalance(new BigDecimal("100.00")); accounts.save(account2);

        for (String type : new String[]{"BILL_PAYMENT", "TRANSFER"}) {
            TransactionRecord record = new TransactionRecord(); record.setInitiatedBy(user);
            record.setFromAccount(account);
            if (type.equals("TRANSFER")) {
                record.setToAccount(account2);
            } else {
                record.setBillType("ELECTRICITY");
                record.setBillReference("REF-" + suffix);
            }
            record.setTransactionType(type); record.setAmount(new BigDecimal("10.00")); record.setStatus("COMPLETED");
            record.setCreatedAt(LocalDateTime.now()); record.setCompletedAt(LocalDateTime.now()); record.setDescription("History regression " + suffix);
            transactions.save(record);

            if (type.equals("BILL_PAYMENT")) {
                BillPayment bill = new BillPayment();
                bill.setCustomer(customer);
                bill.setAccount(account);
                bill.setTransaction(record);
                bill.setBillType("ELECTRICITY");
                bill.setReferenceNumber("REF-" + suffix);
                bill.setAmount(new BigDecimal("10.00"));
                bill.setPaymentDate(LocalDate.now());
                bill.setStatus("COMPLETED");
                bill.setCreatedAt(LocalDateTime.now());
                bill.setCompletedAt(LocalDateTime.now());
                billPayments.save(bill);
            }
        }
        transactions.flush();
        var page = PageRequest.of(0, 20);
        assertEquals(2, transactions.search(user.getUserId(), null, null, null, null, null, page).getTotalElements());
        assertEquals(2, transactions.search(user.getUserId(), null, null, null, null, "HISTORY REGRESSION", page).getTotalElements());
        assertEquals(1, transactions.search(user.getUserId(), "BILL_PAYMENT", null, null, null, null, page).getTotalElements());
        assertEquals(0, transactions.search(-1, null, null, null, null, suffix, page).getTotalElements());
    }
}
