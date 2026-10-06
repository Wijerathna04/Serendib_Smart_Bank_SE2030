package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankResponses.PageResult;
import com.smartbank.smartbank_api.security.AuthAttemptService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/assistant/messages") @RequiredArgsConstructor
public class AiAssistantController {
    public record Question(@NotBlank @Size(max=1000) String question) {}
    private final AiAssistantService service;
    private final AuthAttemptService attempts;
    private final CurrentUserService current;
    @PostMapping public AiAssistantService.ChatView answer(@Valid @RequestBody Question request) { attempts.check("assistant:"+current.requireUser().getUserId(),20);return service.answer(request.question()); }
    @GetMapping public PageResult<AiAssistantService.ChatView> history(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) { return service.history(page,size); }
}
