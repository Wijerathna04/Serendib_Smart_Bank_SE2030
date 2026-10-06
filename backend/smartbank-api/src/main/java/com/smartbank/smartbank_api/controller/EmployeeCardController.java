package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/employee/cards") @RequiredArgsConstructor
public class EmployeeCardController {
private final CardService service;
@GetMapping public PageResult<CardView> list(@RequestParam(required=false) String status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {return service.staffList(status,page,size);}
@GetMapping("/all") public PageResult<CardView> listAll(@RequestParam(required=false) String query, @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {return service.staffSearchCards(query, page, size);}
@GetMapping("/{id}") public CardView get(@PathVariable Integer id) {return service.staffGet(id);}
@PutMapping("/{id}/issue") public CardView issue(@PathVariable Integer id, @RequestBody(required=false) CardIssueRequest req, @RequestParam(required=false) java.math.BigDecimal creditLimit) {
    java.math.BigDecimal limit = creditLimit != null ? creditLimit : (req != null ? req.creditLimit() : null);
    return service.issue(id, true, limit);
}
@PutMapping("/{id}/reject") public CardView reject(@PathVariable Integer id) {return service.issue(id,false,null);}
@DeleteMapping("/{id}") public void deleteCard(@PathVariable Integer id) {service.deleteCard(id);}
}

