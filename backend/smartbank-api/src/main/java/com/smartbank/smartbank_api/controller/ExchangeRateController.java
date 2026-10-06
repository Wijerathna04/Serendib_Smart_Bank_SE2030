package com.smartbank.smartbank_api.controller;

import com.smartbank.smartbank_api.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/exchange-rates") @RequiredArgsConstructor
public class ExchangeRateController {
    private final ExchangeRateService rates;
    @GetMapping public ExchangeRateService.Rates get() { return rates.latest(); }
}
