package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/cards") @RequiredArgsConstructor
public class CardController {
private final CardService service;
@GetMapping public PageResult<CardView> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {return service.list(page,size);}
@GetMapping("/{id}") public CardView get(@PathVariable Integer id) {return service.get(id);}
@PostMapping public CardView create(@Valid @RequestBody CardRequest r) {return service.request(r);}
@PutMapping("/{id}/{action:activate|block|unblock|cancel}") public CardView action(@PathVariable Integer id,@PathVariable String action) {return service.action(id,action);}
}
