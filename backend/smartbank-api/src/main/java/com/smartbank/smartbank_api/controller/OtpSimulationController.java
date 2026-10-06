package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import java.util.Map;
@RestController @RequestMapping("/api/simulation/otp") @RequiredArgsConstructor
@ConditionalOnProperty(name="bank.otp.simulation-enabled",havingValue="true")
public class OtpSimulationController {
    private final TransactionService transactions;
    private final OtpDeliveryService delivery;
    @GetMapping("/{id}") public Map<String,String> get(@PathVariable Integer id) {
        var t=transactions.get(id); BankRules.require(t.canAuthorize(),"INVALID_STATE","Only the initiating customer can view a pending simulation code");
        return Map.of("code",delivery.simulatedCode(id),"disclosure","Academic simulator only");
    }
}
