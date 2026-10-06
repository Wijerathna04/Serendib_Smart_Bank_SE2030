package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/feedback") @RequiredArgsConstructor
public class FeedbackController {
private final FeedbackService service;
@GetMapping public PageResult<FeedbackView> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {return service.list(page,size);}
@GetMapping("/{id}") public FeedbackView get(@PathVariable Integer id) {return service.get(id);}
@PostMapping public FeedbackView create(@Valid @RequestBody FeedbackInput r) {return service.submit(r);}
@PatchMapping("/{id}") public FeedbackView update(@PathVariable Integer id,@Valid @RequestBody FeedbackInput r) {return service.update(id,r);}
}
