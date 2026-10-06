package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/employee/customers")
@RequiredArgsConstructor
public class EmployeeCustomerController {
    private final UserService service;

    @GetMapping
    public PageResult<ProfileView> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "") String search) {
        return service.customers(page, size, search);
    }

    @RequestMapping(value = "/search-by-nic", method = {RequestMethod.GET, RequestMethod.POST})
    public CustomerSearchResult searchByNic(@RequestParam(required = false) String nic) {
        return service.searchCustomerByNic(nic);
    }

    @GetMapping("/{id}")
    public ProfileView get(@PathVariable Integer id) {
        return service.customer(id);
    }

    @PostMapping("/{userId}/toggle-status")
    public ProfileView toggleCustomerStatus(
            @PathVariable Integer userId,
            @RequestParam boolean enabled) {
        return service.toggleCustomerStatus(userId, enabled);
    }

    @PostMapping("/{userId}/request-deletion")
    public ProfileView requestCustomerDeletion(@PathVariable Integer userId) {
        return service.requestCustomerDeletion(userId);
    }

    @PostMapping("/{userId}/approve-deletion")
    public ProfileView approveCustomerDeletion(@PathVariable Integer userId) {
        return service.approveCustomerDeletion(userId);
    }

    @PostMapping("/{userId}/reject-deletion")
    public ProfileView rejectCustomerDeletion(@PathVariable Integer userId) {
        return service.rejectCustomerDeletion(userId);
    }
}