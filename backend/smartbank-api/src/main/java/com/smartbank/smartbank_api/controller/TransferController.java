package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.TransferService;
import com.smartbank.smartbank_api.dto.BankRequests.Transfer;
import com.smartbank.smartbank_api.dto.BankResponses.TransactionView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/transfers") @RequiredArgsConstructor
public class TransferController {
    private final TransferService service;
    @PostMapping public TransactionView create(@Valid @RequestBody Transfer request,@RequestHeader("Idempotency-Key") String key) { return service.initiate(request,key); }
}
