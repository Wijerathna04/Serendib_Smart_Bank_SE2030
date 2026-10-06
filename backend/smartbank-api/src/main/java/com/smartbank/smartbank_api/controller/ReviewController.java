package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/reviews") @RequiredArgsConstructor
public class ReviewController {
private final ReviewService service;
@GetMapping public PageResult<ReviewView> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {return service.list(page,size);}
@GetMapping("/summary") public ReviewSummary summary() {return service.summary();}
}
