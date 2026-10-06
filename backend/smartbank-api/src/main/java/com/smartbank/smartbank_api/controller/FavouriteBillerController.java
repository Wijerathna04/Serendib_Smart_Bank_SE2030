package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.dto.BankRequests.FavouriteBillerInput;
import com.smartbank.smartbank_api.dto.BankResponses.FavouriteBillerView;
import com.smartbank.smartbank_api.service.FavouriteBillerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favourite-billers")
@RequiredArgsConstructor
public class FavouriteBillerController {
    private final FavouriteBillerService service;

    @GetMapping
    public List<FavouriteBillerView> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FavouriteBillerView create(@Valid @RequestBody FavouriteBillerInput request) {
        return service.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        service.remove(id);
    }
}
