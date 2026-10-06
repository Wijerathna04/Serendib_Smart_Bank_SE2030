package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.dto.BankRequests.Decision;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.service.FixedDepositService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager/fixed-deposits")
@RequiredArgsConstructor
public class ManagerFixedDepositController {
    private final FixedDepositService service;

    @GetMapping("/pending")
    public PageResult<DepositView> listPending(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return service.listPendingManager(page, size);
    }

    @GetMapping("/all")
    public PageResult<DepositView> listAll(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.staffSearchDeposits(query, page, size);
    }

    @GetMapping("/{id}")
    public DepositView get(@PathVariable Integer id) {
        return service.staffGet(id);
    }

    @DeleteMapping("/{id}")
    public void deleteDeposit(@PathVariable Integer id) {
        service.deleteDeposit(id);
    }

    @PostMapping("/{id}/approve")
    public DepositView approve(@PathVariable Integer id, @RequestHeader(value="Idempotency-Key", required=false) String key) {
        if (key == null) key = java.util.UUID.randomUUID().toString();
        return service.managerApprove(id, key);
    }

    @PostMapping("/{id}/reject")
    public DepositView reject(@PathVariable Integer id, @RequestBody Decision req) {
        return service.managerReject(id, req.reason());
    }
}
