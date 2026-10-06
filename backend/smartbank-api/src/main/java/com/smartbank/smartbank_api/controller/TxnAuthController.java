package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.OtpCode;
import com.smartbank.smartbank_api.dto.BankResponses.TransactionView;
import com.smartbank.smartbank_api.exception.BusinessRuleException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/transactions") @RequiredArgsConstructor
public class TxnAuthController {
    private final TransactionPostingService posting;
    private final com.smartbank.smartbank_api.security.AuthAttemptService attempts;
    private final CurrentUserService current;
    @PostMapping("/{id}/verify-otp") public TransactionView verify(@PathVariable Integer id,@Valid @RequestBody OtpCode request) {
        attempts.check("otp:"+current.requireUser().getUserId(),20);
        // Service returns after commit; errors here cannot roll back OTP attempt counters.
        var result=posting.verify(id,request.code());
        if(result.errorCode()!=null) throw new BusinessRuleException(result.errorCode(),result.message()); return result.transaction();
    }
    @PostMapping("/{id}/resend-otp") public void resend(@PathVariable Integer id) { posting.resend(id); }
    @PostMapping("/{id}/cancel") public TransactionView cancel(@PathVariable Integer id) { return posting.cancel(id); }
}
