package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.entity.Account;
import com.smartbank.smartbank_api.entity.BillPayment;
import com.smartbank.smartbank_api.entity.Customer;
import com.smartbank.smartbank_api.entity.TransactionRecord;
import com.smartbank.smartbank_api.service.PdfGeneratorService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PdfGeneratorTests {

    private final PdfGeneratorService pdfGeneratorService = new PdfGeneratorService();
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-05T10:00:00Z"), ZoneId.of("Asia/Colombo"));

    @Test
    void statementPdfStartsWithPdfMagicHeader() {
        Customer customer = new Customer();
        customer.setFullName("John Doe");

        Account account = new Account();
        account.setAccountId(1);
        account.setAccountNumber("1000200030004000");
        account.setBalance(new BigDecimal("50000.00"));

        TransactionRecord txn = new TransactionRecord();
        txn.setTransactionId(101);
        txn.setTransactionType("TRANSFER");
        txn.setAmount(new BigDecimal("1500.00"));
        txn.setStatus("COMPLETED");
        txn.setCreatedAt(LocalDateTime.of(2026, 10, 1, 12, 0, 0));

        byte[] pdfBytes = pdfGeneratorService.generateStatementPdf(
                customer,
                account,
                List.of(txn),
                LocalDateTime.of(2026, 10, 1, 0, 0, 0),
                LocalDateTime.of(2026, 10, 5, 23, 59, 59),
                new BigDecimal("48500.00"),
                new BigDecimal("50000.00"),
                new BigDecimal("1500.00"),
                BigDecimal.ZERO,
                clock
        );

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 100);
        String magicHeader = new String(pdfBytes, 0, 4);
        assertEquals("%PDF", magicHeader);
    }

    @Test
    void transactionReceiptPdfStartsWithPdfHeader() {
        Account fromAccount = new Account();
        fromAccount.setAccountNumber("1111222233334444");

        Account toAccount = new Account();
        toAccount.setAccountNumber("5555666677778888");

        TransactionRecord txn = new TransactionRecord();
        txn.setTransactionId(202);
        txn.setTransactionType("INTERNAL_TRANSFER");
        txn.setAmount(new BigDecimal("2500.00"));
        txn.setStatus("COMPLETED");
        txn.setFromAccount(fromAccount);
        txn.setToAccount(toAccount);
        txn.setCreatedAt(LocalDateTime.of(2026, 10, 2, 14, 30, 0));

        byte[] pdfBytes = pdfGeneratorService.generateTransactionReceiptPdf(txn, clock);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 100);
        assertEquals("%PDF", new String(pdfBytes, 0, 4));
    }

    @Test
    void billPaymentReceiptPdfStartsWithPdfHeader() {
        Account account = new Account();
        account.setAccountNumber("9999888877776666");

        BillPayment billPayment = new BillPayment();
        billPayment.setPaymentId(303);
        billPayment.setBillType("UTILITIES");
        billPayment.setAmount(new BigDecimal("4500.00"));
        billPayment.setStatus("COMPLETED");
        billPayment.setReferenceNumber("BILL-REF-456");
        billPayment.setAccount(account);
        billPayment.setCreatedAt(LocalDateTime.of(2026, 10, 3, 10, 15, 0));

        byte[] pdfBytes = pdfGeneratorService.generateBillPaymentReceiptPdf(billPayment, clock);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 100);
        assertEquals("%PDF", new String(pdfBytes, 0, 4));
    }
}
