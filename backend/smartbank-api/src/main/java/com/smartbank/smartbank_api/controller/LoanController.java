package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/loans") @RequiredArgsConstructor
public class LoanController {
private final LoanService service;
@GetMapping public PageResult<LoanView> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {return service.ownList(page,size);}
@GetMapping("/{id}") public LoanView get(@PathVariable Integer id) {return service.ownGet(id);}
@PostMapping public LoanView create(@Valid @RequestBody LoanApplication r) {return service.apply(r);}
@PostMapping("/{id}/resubmit") public LoanView resubmit(@PathVariable Integer id,@Valid @RequestBody LoanApplication r) {return service.resubmit(id,r);}
@PutMapping("/{id}/cancel") public LoanView cancel(@PathVariable Integer id) {return service.customerAction(id,"cancel",null);}
@PostMapping("/{id}/information") public LoanView info(@PathVariable Integer id,@Valid @RequestBody Decision r) {return service.customerAction(id,"information",r);}
@PostMapping("/{id}/pay") public LoanView payInstallment(@PathVariable Integer id, @Valid @RequestBody LoanPaymentRequest r) {return service.payInstallment(id, r);}
}
