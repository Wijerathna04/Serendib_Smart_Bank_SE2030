package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/employee/feedback") @RequiredArgsConstructor
public class EmployeeFeedbackController {
private final FeedbackService service;
@GetMapping public PageResult<FeedbackView> list(@RequestParam(required=false) String status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {return service.staffList(status,page,size);}
@GetMapping("/{id}") public FeedbackView get(@PathVariable Integer id) {return service.staffGet(id);}
@PutMapping("/{id}/{action:review|approve|reject|resolve|close}") public FeedbackView action(@PathVariable Integer id,@PathVariable String action,@Valid @RequestBody Decision r) {return service.moderate(id,action,r);}
@DeleteMapping("/{id}") public void delete(@PathVariable Integer id) {service.delete(id);}
}

