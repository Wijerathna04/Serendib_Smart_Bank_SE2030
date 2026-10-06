package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employee/loans")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'ADMIN')")
public class EmployeeLoanController {
    private final LoanService service;

    @GetMapping
    public PageResult<LoanView> list(@RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.staffList(status, page, size);
    }

    @GetMapping("/all")
    public PageResult<LoanView> listAll(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.staffSearchLoans(query, page, size);
    }

    @GetMapping("/{id}")
    public LoanView get(@PathVariable Integer id) {
        return service.staffGet(id);
    }

    @DeleteMapping("/{id}")
    public void deleteLoan(@PathVariable Integer id) {
        service.deleteLoan(id);
    }

    @PostMapping("/open")
    public LoanView open(@Valid @RequestBody EmployeeDirectLoan req) {
        return service.employeeCreate(req);
    }

    @PostMapping("/{id}/{action:review|request-information|recommend|reject}")
    public LoanView action(@PathVariable Integer id, @PathVariable String action, @Valid @RequestBody Decision r) {
        return service.officerAction(id, action, r);
    }
}

