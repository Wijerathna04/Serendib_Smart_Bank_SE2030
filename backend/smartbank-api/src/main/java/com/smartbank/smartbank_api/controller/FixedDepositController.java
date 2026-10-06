package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.Deposit;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/fixed-deposits") @RequiredArgsConstructor
public class FixedDepositController {
    private final FixedDepositService service;
    private final TransactionPostingService posting;
    @GetMapping("/products") public List<FixedDepositService.Product> products() { return service.products(); }
    @GetMapping public PageResult<DepositView> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.list(page,size); }
    @GetMapping("/{id}") public DepositView get(@PathVariable Integer id) { return service.get(id); }
    @PostMapping public DepositView create(@Valid @RequestBody Deposit request,@RequestHeader("Idempotency-Key") String key) { return service.create(request,key); }
    @PutMapping("/{id}/close") public DepositView close(@PathVariable Integer id,@RequestHeader("Idempotency-Key") String key) { return service.close(id,key); }
    @PutMapping("/{id}/cancel") public DepositView cancel(@PathVariable Integer id) { DepositView f=service.get(id); BankRules.require("PENDING".equals(f.status()) || "CANCELLED".equals(f.status()),"INVALID_STATE","Only pending deposits can be cancelled"); if("PENDING".equals(f.status())) posting.cancel(f.openingTransactionId()); return service.get(id); }
}
