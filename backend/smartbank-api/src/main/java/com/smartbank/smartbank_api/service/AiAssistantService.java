package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.entity.AiChat;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.dto.BankResponses.PageResult;
import com.smartbank.smartbank_api.exception.BusinessRuleException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.Locale;

/** Deterministic academic FAQ helper. No access to posting, approval, or administrative services. */
@Service @RequiredArgsConstructor @Transactional
public class AiAssistantService {
    private final AiAssistantRepository assistants;
    private final AiChatRepository chats;
    private final CurrentUserService current;
    private final Clock clock;
    public record ChatView(Integer chatId,String question,String response,LocalDateTime createdAt) {}
    private ChatView view(AiChat c) { return new ChatView(c.getChatId(),c.getQuestion(),c.getResponse(),c.getCreatedAt()); }
    public ChatView answer(String question) {
        String q=question.trim().toLowerCase(Locale.ROOT);
        String answer;
        if(q.contains("fixed") || q.contains("deposit")) answer="Open Fixed deposits, choose an active account and a supported term, then verify funding with OTP. Rates are simulated and calculated by the backend. A matured deposit can be closed with OTP; early withdrawal is not supported.";
        else if(q.contains("otp") || q.contains("verification")) answer="OTP confirms a specific pending payment. Codes expire after three minutes by default; the request expires after ten minutes. Use Resend after the cooldown. Never share a real verification code. The academic simulator can show only your own pending code when enabled.";
        else if(q.contains("transfer") || q.contains("beneficiar")) answer="Save a Serendib beneficiary first, then open Transfers. Select your source account and recipient, enter the amount, and verify with OTP. No money moves before successful verification. This application does not use real banking networks.";
        else if(q.contains("bill")) answer="Open Bill payments, select your source account and simulated biller, enter the reference and amount, then verify with OTP. Check payment history or Transactions for the outcome.";
        else if(q.contains("loan")) answer="Apply through Loans and provide your purpose and supporting information. An employee reviews your application, may request more information, and recommends it for a manager decision. Approval in this academic version does not disburse money.";
        else if(q.contains("card")) answer="Request a simulated debit card from Cards. Staff issue it before you can activate it. You can block, unblock, or cancel an eligible card. No real card number, PIN, or CVV is used.";
        else if(q.contains("review") || q.contains("feedback") || q.contains("complaint")) answer="Feedback lets you submit a public review or a private complaint/service request. Only approved REVIEW submissions are published. Complaints and service requests remain private.";
        else if(q.contains("password") || q.contains("profile") || q.contains("login")) answer="Open My profile to update permitted contact details or change your password. Changing a password signs out all sessions. Never send passwords to this helper. Sessions expire after ten minutes of inactivity.";
        else if(q.contains("notification")) answer="Open Notifications to view updates, filter them, mark them read or unread, or hide them. You can only view your own notifications.";
        else if(q.contains("account") || q.contains("balance")) answer="Accounts shows your own account details and balances. Account Management is read-only. For this academic demonstration, bank accounts are provisioned separately from customer registration.";
        else answer="I am a rule-based academic FAQ helper. Ask about accounts, fixed deposits, transfers, OTP, bills, loans, cards, feedback, or notifications. I cannot access balances, execute payments, approve loans, or make financial recommendations.";
        AiChat chat=new AiChat();chat.setCustomer(current.requireCustomer());chat.setAssistant(assistants.findFirstByStatusIgnoreCaseOrderByAssistantIdAsc("ACTIVE").orElseThrow(()->new BusinessRuleException("ASSISTANT_UNAVAILABLE","The FAQ helper is not configured. Apply the documented seed data.")));
        chat.setQuestion(question.trim());chat.setResponse(answer);chat.setCreatedAt(LocalDateTime.now(clock));return view(chats.save(chat));
    }
    @Transactional(readOnly=true) public PageResult<ChatView> history(int page,int size) { return PageResult.from(chats.findByCustomer_User_UserId(current.requireUser().getUserId(),BankRules.page(page,size,"createdAt")).map(this::view)); }
}
