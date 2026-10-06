package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/manager/loans") @RequiredArgsConstructor
public class ManagerLoanController {
private final LoanService service;
@GetMapping public PageResult<LoanView> list(@RequestParam(defaultValue="PENDING_MANAGER_REVIEW") String status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {return service.staffList(status,page,size);}
@GetMapping("/{id}") public LoanView get(@PathVariable Integer id) {return service.staffGet(id);}
@GetMapping("/all")
public PageResult<LoanView> listAll(@RequestParam(required = false) String query, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    return service.staffSearchLoans(query, page, size);
}

@DeleteMapping("/{id}")
public void deleteLoan(@PathVariable Integer id) {
    service.deleteLoan(id);
}

@PostMapping("/{id}/approve") public LoanView approve(@PathVariable Integer id,@Valid @RequestBody Decision r) {return service.managerAction(id,true,r);}
@PostMapping("/{id}/reject") public LoanView reject(@PathVariable Integer id,@Valid @RequestBody Decision r) {return service.managerAction(id,false,r);}
}
