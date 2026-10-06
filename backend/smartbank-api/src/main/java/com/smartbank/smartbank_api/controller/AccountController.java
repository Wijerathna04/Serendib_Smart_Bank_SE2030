package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.entity.Account;
import com.smartbank.smartbank_api.entity.TransactionRecord;
import com.smartbank.smartbank_api.entity.User;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController @RequestMapping("/api/accounts") @RequiredArgsConstructor
public class AccountController {
    private final AccountService service;
    private final MonthlyStatementService statementService;
    private final CurrentUserService currentUserService;
    private final AccountRepository accountRepository;
    private final TransactionRecordRepository transactionRecordRepository;
    private final AuditLogService auditLogService;
    private final PdfGeneratorService pdfGeneratorService;
    private final Clock clock;

    @GetMapping public PageResult<AccountView> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.list(page,size); }
    @GetMapping("/{id}") public AccountView get(@PathVariable Integer id) { return service.get(id); }
    @PostMapping("/apply") public AccountView apply(@RequestBody @jakarta.validation.Valid AccountApplication req) { return service.apply(req); }
    @PostMapping("/{id}/primary") public AccountView setPrimary(@PathVariable Integer id) { return service.setPrimaryAccount(id); }
    
    @GetMapping("/{id}/statement")
    public String getMonthlyStatement(@PathVariable Integer id, @RequestParam(required = false) String month) {
        Account account = accountRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        User user = currentUserService.requireUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";
        boolean isStaff = "ROLE_EMPLOYEE".equalsIgnoreCase(roleName) || "EMPLOYEE".equalsIgnoreCase(roleName)
                || "ROLE_MANAGER".equalsIgnoreCase(roleName) || "MANAGER".equalsIgnoreCase(roleName)
                || "ROLE_ADMIN".equalsIgnoreCase(roleName) || "ADMIN".equalsIgnoreCase(roleName);
        if (!isStaff) {
            if (account.getCustomer() == null || account.getCustomer().getUser() == null || !account.getCustomer().getUser().getUserId().equals(user.getUserId())) {
                throw new AccessDeniedException("Access denied: You do not own this bank account.");
            }
        }
        return statementService.getStatementForAccount(id, month);
    }

    @GetMapping(value = "/{id}/statement.pdf", produces = "application/pdf")
    public ResponseEntity<byte[]> getStatementPdf(
            @PathVariable Integer id,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        Account account = accountRepository.findById(id).orElseThrow(ResourceNotFoundException::new);
        User user = currentUserService.requireUser();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";
        boolean isManagerOrAdmin = "ROLE_MANAGER".equalsIgnoreCase(roleName) || "MANAGER".equalsIgnoreCase(roleName)
                || "ROLE_ADMIN".equalsIgnoreCase(roleName) || "ADMIN".equalsIgnoreCase(roleName);

        if (!isManagerOrAdmin) {
            if (account.getCustomer() == null || account.getCustomer().getUser() == null || !account.getCustomer().getUser().getUserId().equals(user.getUserId())) {
                throw new AccessDeniedException("Access denied: Customer can only download their own account statement.");
            }
        } else {
            auditLogService.record(user, "STATEMENT_PDF_DOWNLOAD", "Account", account.getAccountId());
        }

        ZoneId colomboZone = ZoneId.of("Asia/Colombo");
        LocalDate todayColombo = LocalDate.now(clock.withZone(colomboZone));
        LocalDate fromDate = (from != null && !from.isBlank()) ? LocalDate.parse(from.trim()) : todayColombo.withDayOfMonth(1);
        LocalDate toDate = (to != null && !to.isBlank()) ? LocalDate.parse(to.trim()) : todayColombo;

        BankRules.require(!fromDate.isAfter(toDate), "INVALID_DATE_RANGE", "From date must be on or before To date");
        BankRules.require(ChronoUnit.DAYS.between(fromDate, toDate) <= 366, "DATE_RANGE_EXCEEDED", "Date range cannot exceed 366 days");

        LocalDateTime startDateTime = fromDate.atStartOfDay();
        LocalDateTime endDateTime = toDate.atTime(23, 59, 59);

        List<TransactionRecord> txns = transactionRecordRepository.findByAccountIdAndDateRange(id, startDateTime, endDateTime);

        BigDecimal totalCredits = BigDecimal.ZERO;
        BigDecimal totalDebits = BigDecimal.ZERO;
        for (TransactionRecord t : txns) {
            if ("COMPLETED".equals(t.getStatus())) {
                if (t.getToAccount() != null && id.equals(t.getToAccount().getAccountId())) {
                    totalCredits = totalCredits.add(t.getAmount());
                }
                if (t.getFromAccount() != null && id.equals(t.getFromAccount().getAccountId())) {
                    totalDebits = totalDebits.add(t.getAmount());
                }
            }
        }

        BigDecimal closingBal = account.getBalance();
        BigDecimal openingBal = closingBal.subtract(totalCredits).add(totalDebits);

        byte[] pdfBytes = pdfGeneratorService.generateStatementPdf(
                account.getCustomer(), account, txns, startDateTime, endDateTime,
                openingBal, closingBal, totalCredits, totalDebits, clock
        );

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"statement-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
