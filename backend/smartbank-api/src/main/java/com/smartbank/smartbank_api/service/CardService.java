package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.dto.BankRequests.CardRequest;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Transactional
public class CardService {
    private final CardRepository cards;
    private final AccountRepository accounts;
    private final TransactionRecordRepository transactionRecords;
    private final CurrentUserService current;
    private final NotificationService notifications;
    private final AuditLogService audit;
    private final Clock clock;
    private final RiskScoringService riskScoringService;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private CardView view(Card c) {
        return view(c, false);
    }

    private CardView view(Card c, boolean includeRisk) {
        Integer riskScore = null;
        String riskLevel = null;
        List<String> riskFactors = null;
        String riskExplanation = null;

        if (includeRisk) {
            var riskOpt = riskAssessmentRepository.findTopByApplicationTypeAndApplicationIdOrderByCreatedAtDesc("CARD", c.getCardId());
            if (riskOpt.isPresent()) {
                var r = riskOpt.get();
                riskScore = r.getRiskScore();
                riskLevel = r.getRiskLevel();
                riskExplanation = r.getExplanation();
                try {
                    if (r.getRiskFactors() != null && !r.getRiskFactors().isBlank()) {
                        riskFactors = objectMapper.readValue(r.getRiskFactors(), List.class);
                    }
                } catch (Exception e) {}
            }
        }
        return ResponseMapper.card(c, LocalDate.now(clock), riskScore, riskLevel, riskFactors, riskExplanation);
    }

    private void event(Card c, String action) {
        c.setUpdatedAt(LocalDateTime.now(clock));
        audit.record(current.requireUser(), "CARD_" + action, "Card", c.getCardId());
        User owner = c.getOwnerUser();
        if (owner != null) {
            notifications.createNotification(
                owner.getUserId(),
                "CARD_STATUS_CHANGED",
                "Card update",
                "Card #" + c.getCardId() + " (" + (c.getCardProduct() != null ? c.getCardProduct() : c.getCardType()) + ") is now " + c.getStatus() + "."
            );
        }
    }

    public CardView request(CardRequest r) {
        Card c = new Card();
        User currentUser = current.requireUser();
        c.setUser(currentUser);
        c.setCardType(r.cardType());

        if ("CREDIT".equals(r.cardType())) {
            // Standalone Credit Card application - NOT tied to any bank deposit account
            BankRules.require(
                !cards.existsByUserIdAndCardTypeAndStatusIn(currentUser.getUserId(), "CREDIT", Set.of("PENDING", "ACTIVE", "BLOCKED")),
                "DUPLICATE_CARD",
                "An active credit card or pending credit card application already exists for your account."
            );
            c.setAccount(null);
            c.setCardProduct(r.cardProduct() != null ? r.cardProduct() : "Serendib Platinum Credit Card");
            c.setFullName(r.fullName());
            c.setNicNumber(r.nicNumber());
            c.setMobileNumber(r.mobileNumber());
            c.setEmailAddress(r.emailAddress());
            c.setResidentialAddress(r.residentialAddress());
            c.setHousingStatus(r.housingStatus());
            c.setEmploymentType(r.employmentType());
            c.setEmployerName(r.employerName());
            c.setDesignation(r.designation());
            c.setYearsOfService(r.yearsOfService());
            c.setGrossMonthlyIncome(r.grossMonthlyIncome());
            c.setFixedAllowances(r.fixedAllowances());
            c.setExistingCreditDeductions(r.existingCreditDeductions());
            c.setPrimaryBankName(r.primaryBankName());
            c.setCribConsent(r.cribConsent());
            c.setPaySlipsUpload(r.paySlipsUpload());
            c.setBankStatementsUpload(r.bankStatementsUpload());
            c.setEmploymentLetterUpload(r.employmentLetterUpload());

            java.math.BigDecimal requested = r.requestedCreditLimit() != null ? r.requestedCreditLimit() : new java.math.BigDecimal("250000.00");
            c.setCreditLimit(requested);
            c.setStatus("PENDING");
        } else {
            // Debit Card application - MUST be linked to an active savings or checking account
            BankRules.require(r.accountId() != null, "INVALID_INPUT", "A linked bank account is required for debit cards.");
            Account a = current.requireOwnedAccount(r.accountId());
            a = accounts.lockById(a.getAccountId()).orElseThrow(ResourceNotFoundException::new);
            BankRules.active(a);
            BankRules.require(
                !cards.existsByAccount_AccountIdAndCardTypeAndStatusIn(a.getAccountId(), "DEBIT", Set.of("PENDING", "ACTIVE", "BLOCKED")),
                "DUPLICATE_CARD",
                "An existing debit card or request already exists for this bank account."
            );
            c.setAccount(a);
            c.setCardProduct(r.cardProduct() != null && !r.cardProduct().isBlank() ? r.cardProduct() : "Classic Debit Card");
            c.setStatus("PENDING");
        }

        if (c.getCardNumber() == null || c.getCardNumber().isBlank()) {
            c.setCardNumber("REQ-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        c.setRequestedAt(LocalDateTime.now(clock));
        c.setUpdatedAt(c.getRequestedAt());
        cards.save(c);
        if ("CREDIT".equals(c.getCardType())) {
            try {
                riskScoringService.evaluateAndSaveCard(c);
            } catch (Exception e) {
                // Scoring failure never blocks application submission
            }
        }
        event(c, "REQUESTED");
        return view(c, false);
    }

    @Transactional(readOnly = true)
    public PageResult<CardView> list(int page, int size) {
        return PageResult.from(cards.findByUserId(current.requireUser().getUserId(), BankRules.page(page, size, "cardId")).map(c -> view(c, false)));
    }

    @Transactional(readOnly = true)
    public CardView get(Integer id) {
        return view(cards.findByCardIdAndUserId(id, current.requireUser().getUserId()).orElseThrow(ResourceNotFoundException::new), false);
    }

    @Transactional(readOnly = true)
    public PageResult<CardView> staffList(String status, int page, int size) {
        var p = BankRules.page(page, size, "cardId");
        return PageResult.from((status == null ? cards.findAll(p) : cards.findByStatus(status, p)).map(c -> view(c, true)));
    }

    @Transactional(readOnly = true)
    public PageResult<CardView> staffSearchCards(String query, int page, int size) {
        var p = BankRules.page(page, size, "cardId");
        return PageResult.from((query == null || query.isBlank() ? cards.findAll(p) : cards.searchCards(query.trim(), p)).map(c -> view(c, true)));
    }

    @Transactional(readOnly = true)
    public CardView staffGet(Integer id) {
        return view(cards.findById(id).orElseThrow(ResourceNotFoundException::new), true);
    }

    public void deleteCard(Integer id) {
        current.requireUser();
        cards.deleteById(id);
    }

    public CardView issue(Integer id, boolean issue, java.math.BigDecimal creditLimit) {
        Card c = cards.lockById(id).orElseThrow(ResourceNotFoundException::new);
        BankRules.require("PENDING".equals(c.getStatus()) && c.getIssuedAt() == null, "INVALID_STATE", "Only unissued requests may be processed");
        if (issue) {
            User staffUser = current.requireUser();
            if ("DEBIT".equals(c.getCardType())) {
                Account a = c.getAccount();
                BankRules.require(a != null, "INVALID_STATE", "Debit card must be linked to a valid account");
                a = accounts.lockById(a.getAccountId()).orElseThrow(ResourceNotFoundException::new);
                BankRules.active(a);

                java.math.BigDecimal cardFee = new java.math.BigDecimal("500.00");
                BankRules.require(a.getBalance().compareTo(cardFee) >= 0, "INSUFFICIENT_BALANCE", "Account balance must be at least LKR 500.00 for Debit Card issuance fee");

                a.setBalance(a.getBalance().subtract(cardFee));
                accounts.save(a);

                TransactionRecord feeRecord = new TransactionRecord();
                feeRecord.setFromAccount(a);
                feeRecord.setAmount(cardFee);
                feeRecord.setTransactionType("CARD_FEE");
                feeRecord.setStatus("COMPLETED");
                feeRecord.setDescription("Debit Card Issuance Fee (LKR 500.00) - " + (c.getCardProduct() != null ? c.getCardProduct() : "Serendib Sovereign Debit"));
                feeRecord.setCreatedAt(LocalDateTime.now(clock));
                feeRecord.setCompletedAt(LocalDateTime.now(clock));
                feeRecord.setInitiatedBy(staffUser);
                transactionRecords.save(feeRecord);

                notifications.createNotification(
                    a.getCustomer().getUser().getUserId(),
                    "CARD_FEE_DEDUCTED",
                    "Debit Card Fee Deducted",
                    "LKR 500.00 issuance fee has been deducted from account (" + a.getAccountNumber() + ") for your approved Debit Card. Remaining balance: LKR " + BankRules.decimal(a.getBalance()) + "."
                );
            } else if (c.getAccount() != null) {
                BankRules.active(c.getAccount());
            }

            c.setCardNumber("SIM-" + UUID.randomUUID());
            c.setIssuedAt(LocalDateTime.now(clock));
            c.setIssuedBy(staffUser);
            c.setExpiryDate(LocalDate.now(clock).plusYears(3));
            if ("CREDIT".equals(c.getCardType())) {
                java.math.BigDecimal finalLimit = creditLimit != null ? creditLimit : (c.getCreditLimit() != null ? c.getCreditLimit() : new java.math.BigDecimal("250000.00"));
                c.setCreditLimit(finalLimit);
                c.setAvailableCredit(finalLimit);
                c.setCurrentBalance(java.math.BigDecimal.ZERO);
            }

            var riskOpt = riskAssessmentRepository.findTopByApplicationTypeAndApplicationIdOrderByCreatedAtDesc("CARD", c.getCardId());
            if (riskOpt.isPresent() && "HIGH".equalsIgnoreCase(riskOpt.get().getRiskLevel())) {
                audit.record(staffUser, "HIGH_RISK_APPROVAL", "Card", c.getCardId());
            }
        } else {
            c.setStatus("CANCELLED");
        }
        event(c, issue ? "ISSUED" : "REQUEST_REJECTED");
        return view(c, true);
    }

    public CardView issue(Integer id, boolean issue) {
        return issue(id, issue, null);
    }

    public CardView action(Integer id, String action) {
        Card c = cards.lockById(id).orElseThrow(ResourceNotFoundException::new);
        User owner = c.getOwnerUser();
        if (owner == null || !owner.getUserId().equals(current.requireUser().getUserId())) {
            throw new ResourceNotFoundException();
        }

        String s = c.getStatus();
        if ("cancel".equals(action)) {
            if (!"CANCELLED".equals(s)) {
                c.setStatus("CANCELLED");
                event(c, "CANCELLED");
            }
            return view(c);
        }

        BankRules.require(c.getExpiryDate() == null || !c.getExpiryDate().isBefore(LocalDate.now(clock)), "CARD_EXPIRED", "Card has expired");

        switch (action) {
            case "activate" -> {
                BankRules.require("PENDING".equals(s) && c.getIssuedAt() != null, "INVALID_STATE", "Card must be issued before activation");
                if (c.getAccount() != null) BankRules.active(c.getAccount());
                c.setStatus("ACTIVE");
            }
            case "block" -> {
                BankRules.require("ACTIVE".equals(s) || "BLOCKED".equals(s), "INVALID_STATE", "Only active cards can be blocked");
                if ("BLOCKED".equals(s)) return view(c);
                c.setStatus("BLOCKED");
            }
            case "unblock" -> {
                BankRules.require("BLOCKED".equals(s), "INVALID_STATE", "Only blocked cards can be unblocked");
                if (c.getAccount() != null) BankRules.active(c.getAccount());
                c.setStatus("ACTIVE");
            }
            default -> throw new IllegalArgumentException("Invalid card action");
        }

        String eventName = switch (action) {
            case "activate" -> "ACTIVATED";
            case "block" -> "BLOCKED";
            case "unblock" -> "UNBLOCKED";
            default -> action.toUpperCase(Locale.ROOT);
        };
        event(c, eventName);
        return view(c);
    }
}

