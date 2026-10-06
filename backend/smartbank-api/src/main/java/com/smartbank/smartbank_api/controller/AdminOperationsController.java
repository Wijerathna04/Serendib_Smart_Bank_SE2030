package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.dto.BankResponses.PageResult;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Bank-wide read projections. Customer financial actions retain ownership and OTP checks. */
@RestController @RequestMapping("/api/admin/operations") @RequiredArgsConstructor
@Transactional(readOnly=true)
public class AdminOperationsController {
    private final AccountRepository accounts;
    private final TransactionRecordRepository transactions;
    private final FixedDepositRepository deposits;
    private final BillPaymentRepository bills;
    private final BeneficiaryRepository beneficiaries;
    private final MonthlyStatementService statementService;
    private final SmsService smsService;
    private final EmailService emailService;

    @GetMapping("/notifications/health")
    public java.util.Map<String, Object> getNotificationHealth() {
        return java.util.Map.of(
            "smsProvider", smsService.getProviderName(),
            "smsConfigured", smsService.isConfigured(),
            "emailProvider", emailService.getProviderName(),
            "emailConfigured", emailService.isConfigured(),
            "status", "UP"
        );
    }

    @GetMapping("/{kind:accounts|transactions|fixed-deposits|bill-payments|beneficiaries}")
    public PageResult<?> list(@PathVariable String kind,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return switch(kind) {
            case "accounts" -> PageResult.from(accounts.findAll(BankRules.page(page,size,"accountId")).map(ResponseMapper::account));
            case "transactions" -> PageResult.from(transactions.findAll(BankRules.page(page,size,"transactionId")).map(t->ResponseMapper.transaction(t,null)));
            case "fixed-deposits" -> PageResult.from(deposits.findAll(BankRules.page(page,size,"fixedDepositId")).map(ResponseMapper::deposit));
            case "bill-payments" -> PageResult.from(bills.findAll(BankRules.page(page,size,"paymentId")).map(ResponseMapper::bill));
            case "beneficiaries" -> PageResult.from(beneficiaries.findAll(BankRules.page(page,size,"beneficiaryId")).map(ResponseMapper::beneficiary));
            default -> throw new IllegalArgumentException("Unknown operation");
        };
    }

    @PostMapping("/dispatch-monthly-statements")
    @Transactional
    public String triggerMonthlyStatements() {
        statementService.generateAndSendMonthlyStatements();
        return "Monthly statements batch dispatch process triggered successfully.";
    }
}
