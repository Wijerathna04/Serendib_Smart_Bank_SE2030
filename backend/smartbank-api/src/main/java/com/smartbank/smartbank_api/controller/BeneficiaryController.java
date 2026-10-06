package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/beneficiaries") @RequiredArgsConstructor
public class BeneficiaryController {
private final BeneficiaryService service;
@GetMapping public PageResult<BeneficiaryView> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {return service.list(page,size);}
@GetMapping("/{id}") public BeneficiaryView get(@PathVariable Integer id) {return service.get(id);}
@PostMapping public BeneficiaryView create(@Valid @RequestBody BeneficiaryInput r) {return service.create(r);}
@PatchMapping("/{id}") public BeneficiaryView update(@PathVariable Integer id,@Valid @RequestBody BeneficiaryInput r) {return service.update(id,r);}
@DeleteMapping("/{id}") public void remove(@PathVariable Integer id) {service.remove(id);}
}
