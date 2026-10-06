package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employee/accounts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
public class EmployeeAccountController {
    private final AccountService service;

    @GetMapping("/pending")
    public PageResult<AccountView> listPending(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.listPendingEmployee(page, size);
    }

    @PostMapping("/open")
    public AccountView createDirectly(@RequestBody @Valid EmployeeDirectAccount req) {
        return service.employeeCreate(req);
    }

    @PostMapping("/{id}/approve")
    public AccountView approve(@PathVariable Integer id, @RequestBody(required = false) AccountApprovalRequest req) {
        java.math.BigDecimal initialDeposit = req != null ? req.initialDeposit() : null;
        return service.approve(id, initialDeposit);
    }


    @PostMapping("/{id}/reject")
    public AccountView reject(@PathVariable Integer id, @RequestBody Decision req) {
        return service.reject(id, req.reason());
    }

    @GetMapping("/all")
    public PageResult<AccountView> listAll(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.listAllAccounts(query, page, size);
    }

    @GetMapping("/{id}/transactions")
    public PageResult<TransactionView> getTransactions(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return service.getAccountTransactions(id, page, size);
    }

    @PostMapping("/{id}/hold")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public AccountView toggleHold(@PathVariable Integer id) {
        return service.toggleHoldAccount(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public void deleteAccount(@PathVariable Integer id) {
        service.deleteAccount(id);
    }

    @PostMapping("/deposit")
    public TransactionView depositCash(@RequestBody @Valid DirectDeposit req) {
        return service.depositCash(req);
    }
}