package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Automated Monthly Account Statement Generation & Email Dispatcher Service.
 * Generates monthly statements at the end of every month and emails them to registered customer emails.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MonthlyStatementService {
    private final AccountRepository accountRepository;
    private final TransactionRecordRepository transactionRepository;
    private final CustomerRepository customerRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final PdfGeneratorService pdfGeneratorService;
    private final Clock clock;

    /**
     * Automatic Batch Job: Runs at 11:00 PM on month-end days (28-31) of every month.
     * Generates and dispatches monthly account statements to all active customers via registered email.
     */
    @Scheduled(cron = "0 0 23 28-31 * ?")
    public void generateAndSendMonthlyStatements() {
        LocalDate today = LocalDate.now(clock);
        // Only trigger on the actual last day of the current month
        if (today.getDayOfMonth() != today.lengthOfMonth()) {
            return;
        }

        log.info("Starting automated month-end statement generation for month: {}", today.getMonth());
        YearMonth currentMonth = YearMonth.from(today);
        LocalDateTime startOfMonth = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = currentMonth.atEndOfMonth().atTime(23, 59, 59);

        List<Customer> allCustomers = customerRepository.findAll();
        int totalDispatched = 0;

        for (Customer customer : allCustomers) {
            if (customer.getUser() == null || customer.getUser().getEmail() == null || customer.getUser().getEmail().isBlank()) {
                continue;
            }

            List<Account> customerAccounts = accountRepository.findByCustomer_CustomerId(customer.getCustomerId());
            if (customerAccounts.isEmpty()) {
                continue;
            }

            for (Account account : customerAccounts) {
                if ("DELETED".equals(account.getStatus())) {
                    continue;
                }

                // Fetch current month transactions via repository query
                List<TransactionRecord> monthlyTxns = transactionRepository.findByAccountIdAndDateRange(
                        account.getAccountId(), startOfMonth, endOfMonth
                );

                BigDecimal totalCredits = BigDecimal.ZERO;
                BigDecimal totalDebits = BigDecimal.ZERO;

                for (TransactionRecord t : monthlyTxns) {
                    if ("COMPLETED".equals(t.getStatus())) {
                        if (t.getToAccount() != null && account.getAccountId().equals(t.getToAccount().getAccountId())) {
                            totalCredits = totalCredits.add(t.getAmount());
                        }
                        if (t.getFromAccount() != null && account.getAccountId().equals(t.getFromAccount().getAccountId())) {
                            totalDebits = totalDebits.add(t.getAmount());
                        }
                    }
                }

                String monthLabel = today.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
                String subject = "📄 Serendib Smart Bank - Monthly Account Statement (" + monthLabel + ")";
                
                BigDecimal closingBal = account.getBalance();
                BigDecimal openingBal = closingBal.subtract(totalCredits).add(totalDebits);

                byte[] pdfBytes = null;
                if (pdfGeneratorService != null) {
                    try {
                        pdfBytes = pdfGeneratorService.generateStatementPdf(
                            customer, account, monthlyTxns, startOfMonth, endOfMonth,
                            openingBal, closingBal, totalCredits, totalDebits, clock
                        );
                    } catch (Exception e) {
                        log.error("Failed to generate PDF for monthly statement account {}: {}", account.getAccountId(), e.getMessage());
                    }
                }

                // 1. Dispatch Email with PDF Attachment to customer's registered email
                if (emailService != null) {
                    emailService.sendNotificationEmailWithAttachment(
                            customer.getUser().getEmail(),
                            customer.getUser().getUsername(),
                            subject,
                            "Your monthly account statement for " + monthLabel + " on account " + account.getAccountNumber() + " is ready. Total Credits: LKR " + totalCredits + ", Total Debits: LKR " + totalDebits + ", Closing Balance: LKR " + account.getBalance(),
                            pdfBytes,
                            "statement-" + account.getAccountNumber() + ".pdf"
                    );
                }

                // 2. Log in-app notification
                notificationService.createNotification(
                        customer.getUser().getUserId(),
                        "MONTHLY_STATEMENT",
                        "Monthly Account Statement Sent (" + monthLabel + ")",
                        "Your monthly e-statement for account " + account.getAccountNumber() + " has been generated and dispatched to " + customer.getUser().getEmail() + "."
                );

                totalDispatched++;
            }
        }

        log.info("Automated month-end statement generation completed. Dispatched {} statements.", totalDispatched);
    }

    /**
     * Customer On-Demand Monthly Statement Projections
     */
    @Transactional(readOnly = true)
    public String getStatementForAccount(Integer accountId, String yearMonthStr) {
        Account account = accountRepository.findById(accountId).orElseThrow();
        YearMonth ym = (yearMonthStr != null && !yearMonthStr.isBlank())
                ? YearMonth.parse(yearMonthStr)
                : YearMonth.now(clock);

        LocalDateTime startOfMonth = ym.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = ym.atEndOfMonth().atTime(23, 59, 59);

        List<TransactionRecord> monthlyTxns = transactionRepository.findByAccountIdAndDateRange(
                account.getAccountId(), startOfMonth, endOfMonth
        );

        BigDecimal totalCredits = BigDecimal.ZERO;
        BigDecimal totalDebits = BigDecimal.ZERO;

        for (TransactionRecord t : monthlyTxns) {
            if ("COMPLETED".equals(t.getStatus())) {
                if (t.getToAccount() != null && account.getAccountId().equals(t.getToAccount().getAccountId())) {
                    totalCredits = totalCredits.add(t.getAmount());
                }
                if (t.getFromAccount() != null && account.getAccountId().equals(t.getFromAccount().getAccountId())) {
                    totalDebits = totalDebits.add(t.getAmount());
                }
            }
        }

        Customer c = account.getCustomer();
        String monthLabel = ym.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
        return buildStatementHtml(c, account, monthLabel, monthlyTxns, totalCredits, totalDebits);
    }

    private String buildStatementHtml(Customer customer, Account account, String monthLabel, List<TransactionRecord> txns, BigDecimal credits, BigDecimal debits) {
        StringBuilder sb = new StringBuilder();
        sb.append("SERENDIB SMART BANK - OFFICIAL MONTHLY STATEMENT\n");
        sb.append("Statement Period: ").append(monthLabel).append("\n");
        sb.append("Customer: ").append(customer != null ? customer.getFullName() : "Valued Customer").append("\n");
        sb.append("Account Number: ").append(account.getAccountNumber()).append(" (").append(account.getAccountType()).append(")\n");
        sb.append("Closing Balance: LKR ").append(account.getBalance()).append("\n");
        sb.append("Total Income/Credits: LKR ").append(credits).append("\n");
        sb.append("Total Expenses/Debits: LKR ").append(debits).append("\n\n");
        sb.append("TRANSACTION HISTORY:\n");

        if (txns.isEmpty()) {
            sb.append("No transaction records for this statement period.\n");
        } else {
            for (TransactionRecord t : txns) {
                sb.append("#").append(t.getTransactionId())
                  .append(" | ").append(t.getCreatedAt())
                  .append(" | ").append(t.getTransactionType())
                  .append(" | LKR ").append(t.getAmount())
                  .append(" | Status: ").append(t.getStatus())
                  .append(" | ").append(t.getDescription())
                  .append("\n");
            }
        }
        return sb.toString();
    }
}
