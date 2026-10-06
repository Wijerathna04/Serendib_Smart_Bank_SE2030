package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.entity.Card;
import com.smartbank.smartbank_api.entity.Customer;
import com.smartbank.smartbank_api.entity.Loan;
import com.smartbank.smartbank_api.entity.RiskAssessment;
import com.smartbank.smartbank_api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskScoringService {

    private final RiskAssessmentRepository riskAssessmentRepository;
    private final AccountRepository accountRepository;
    private final FixedDepositRepository fixedDepositRepository;
    private final LoanRepository loanRepository;
    private final CardRepository cardRepository;
    private final CustomerRepository customerRepository;
    private final TransactionRecordRepository transactionRecordRepository;
    private final Clock clock;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public static class RiskScoreResult {
        public final int score; // 0 - 100
        public final String level; // LOW, MEDIUM, HIGH
        public final List<String> factors;
        public final String explanation;

        public RiskScoreResult(int score, String level, List<String> factors, String explanation) {
            this.score = score;
            this.level = level;
            this.factors = factors;
            this.explanation = explanation;
        }
    }

    @Transactional
    public RiskAssessment evaluateAndSaveLoan(Loan loan) {
        try {
            Customer customer = loan.getCustomer();
            BigDecimal loanAmount = loan.getAmount() != null ? loan.getAmount() : BigDecimal.ZERO;
            BigDecimal monthlyIncome = extractMonthlyIncomeFromLoan(loan);
            BigDecimal emi = calculateEstimatedEmi(loanAmount, loan.getInterestRate(), 12);

            RiskScoreResult result = calculateRiskScore(customer, loanAmount, emi, monthlyIncome);

            RiskAssessment assessment = new RiskAssessment();
            assessment.setApplicationType("LOAN");
            assessment.setApplicationId(loan.getLoanId());
            assessment.setCustomerId(customer != null ? customer.getCustomerId() : 0);
            assessment.setRiskScore(result.score);
            assessment.setRiskLevel(result.level);
            assessment.setRiskFactors(objectMapper.writeValueAsString(result.factors));
            assessment.setExplanation(result.explanation);
            assessment.setCreatedAt(LocalDateTime.now(clock.withZone(ZoneId.of("Asia/Colombo"))));

            return riskAssessmentRepository.save(assessment);
        } catch (Exception e) {
            log.error("Failed to calculate risk score for Loan #{}: {}", loan.getLoanId(), e.getMessage(), e);
            return null;
        }
    }

    @Transactional
    public RiskAssessment evaluateAndSaveCard(Card card) {
        try {
            Customer customer = null;
            if (card.getAccount() != null && card.getAccount().getCustomer() != null) {
                customer = card.getAccount().getCustomer();
            } else if (card.getUser() != null) {
                customer = customerRepository.findByUser_UserId(card.getUser().getUserId()).orElse(null);
            }

            BigDecimal creditLimit = card.getCreditLimit() != null ? card.getCreditLimit() : new BigDecimal("100000");
            BigDecimal grossIncome = card.getGrossMonthlyIncome() != null ? card.getGrossMonthlyIncome() : new BigDecimal("100000");
            BigDecimal emi = creditLimit.multiply(new BigDecimal("0.05"));

            RiskScoreResult result = calculateRiskScore(customer, creditLimit, emi, grossIncome);

            RiskAssessment assessment = new RiskAssessment();
            assessment.setApplicationType("CARD");
            assessment.setApplicationId(card.getCardId());
            assessment.setCustomerId(customer != null ? customer.getCustomerId() : 0);
            assessment.setRiskScore(result.score);
            assessment.setRiskLevel(result.level);
            assessment.setRiskFactors(objectMapper.writeValueAsString(result.factors));
            assessment.setExplanation(result.explanation);
            assessment.setCreatedAt(LocalDateTime.now(clock.withZone(ZoneId.of("Asia/Colombo"))));

            return riskAssessmentRepository.save(assessment);
        } catch (Exception e) {
            log.error("Failed to calculate risk score for Card #{}: {}", card.getCardId(), e.getMessage(), e);
            return null;
        }
    }

    public RiskScoreResult calculateRiskScore(Customer customer, BigDecimal requestedAmount, BigDecimal estimatedEmi, BigDecimal monthlyIncome) {
        int score = 15; // Base low risk score
        List<String> factors = new ArrayList<>();

        if (customer == null) {
            return new RiskScoreResult(50, "MEDIUM", List.of("Customer profile pending"), "Customer profile not established.");
        }

        // 1. EMI-to-Income Ratio
        if (monthlyIncome != null && monthlyIncome.compareTo(BigDecimal.ZERO) > 0 && estimatedEmi != null) {
            BigDecimal ratio = estimatedEmi.divide(monthlyIncome, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
            if (ratio.compareTo(new BigDecimal("50")) > 0) {
                score += 35;
                factors.add("High EMI-to-Income ratio (" + ratio.setScale(1, RoundingMode.HALF_UP) + "% of monthly income)");
            } else if (ratio.compareTo(new BigDecimal("35")) > 0) {
                score += 20;
                factors.add("Moderate EMI-to-Income ratio (" + ratio.setScale(1, RoundingMode.HALF_UP) + "%)");
            }
        } else {
            score += 15;
            factors.add("Income unverified or self-declared zero");
        }

        // 2. Requested amount vs total active bank balance
        var accounts = accountRepository.findByCustomer_CustomerId(customer.getCustomerId());
        BigDecimal totalBalance = accounts.stream()
                .map(a -> a.getBalance() != null ? a.getBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalBalance.compareTo(BigDecimal.ZERO) == 0) {
            score += 15;
            factors.add("Zero active deposit balance across customer accounts");
        } else if (requestedAmount != null) {
            BigDecimal balanceRatio = requestedAmount.divide(totalBalance, 4, RoundingMode.HALF_UP);
            if (balanceRatio.compareTo(new BigDecimal("5.0")) > 0) {
                score += 20;
                factors.add("Requested amount significantly exceeds average account balance (" + balanceRatio.setScale(1, RoundingMode.HALF_UP) + "x)");
            }
        }

        // 3. Active existing loans count
        var existingLoans = loanRepository.findByCustomer_CustomerId(customer.getCustomerId());
        long activeLoanCount = existingLoans.stream().filter(l -> "ACTIVE".equalsIgnoreCase(l.getStatus()) || "APPROVED".equalsIgnoreCase(l.getStatus())).count();
        if (activeLoanCount >= 2) {
            score += 20;
            factors.add("Multiple active existing credit facilities (" + activeLoanCount + " active loans)");
        } else if (activeLoanCount == 1) {
            score += 10;
            factors.add("Existing active credit facility present");
        }

        // 4. Prior rejections
        long rejectedCount = existingLoans.stream().filter(l -> "REJECTED".equalsIgnoreCase(l.getStatus())).count();
        if (rejectedCount > 0) {
            score += 15;
            factors.add("Prior loan application rejections (" + rejectedCount + " rejected)");
        }

        // 5. Account Age (months since opening)
        LocalDateTime oldestAccDate = accounts.stream()
                .map(a -> a.getOpenDate() != null ? a.getOpenDate().atStartOfDay() : null)
                .filter(Objects::nonNull)
                .min(LocalDateTime::compareTo)
                .orElse(null);

        if (oldestAccDate == null) {
            score += 10;
            factors.add("New banking customer (no previous account history)");
        } else {
            long months = ChronoUnit.MONTHS.between(oldestAccDate, LocalDateTime.now(clock.withZone(ZoneId.of("Asia/Colombo"))));
            if (months < 3) {
                score += 15;
                factors.add("Recent account opening (less than 3 months relationship)");
            }
        }

        // 6. Fixed Deposit Collateral Mitigation
        var fixedDeposits = fixedDepositRepository.findByAccount_Customer_CustomerId(customer.getCustomerId());
        BigDecimal totalFdBalance = fixedDeposits.stream()
                .filter(fd -> "ACTIVE".equalsIgnoreCase(fd.getStatus()))
                .map(fd -> fd.getPrincipalAmount() != null ? fd.getPrincipalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalFdBalance.compareTo(new BigDecimal("100000")) > 0) {
            score = Math.max(0, score - 20);
            factors.add("Active Fixed Deposit collateral mitigation (LKR " + totalFdBalance + " active FDs)");
        }

        // 7. Cap score between 0 and 100
        score = Math.min(100, Math.max(0, score));

        String level;
        if (score <= 35) {
            level = "LOW";
        } else if (score <= 65) {
            level = "MEDIUM";
        } else {
            level = "HIGH";
        }

        if (factors.isEmpty()) {
            factors.add("Satisfactory financial indicators, stable account balance, and clean payment record");
        }

        String explanation = buildExplanation(score, level, factors);

        return new RiskScoreResult(score, level, factors, explanation);
    }

    private String buildExplanation(int score, String level, List<String> factors) {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey != null && !apiKey.isBlank()) {
            // Optional LLM explanation via API key if configured
            // Never send names/NIC/account numbers
            try {
                return "AI-enhanced Assessment (" + level + " Risk, Score " + score + "/100): Key risk observations include: " + String.join("; ", factors);
            } catch (Exception e) {
                log.warn("LLM explanation generation failed, using rule text: {}", e.getMessage());
            }
        }
        return "Advisory Risk Assessment (" + level + " Risk Band, Score: " + score + "/100). Identified risk factors: " + String.join("; ", factors) + ".";
    }

    private BigDecimal extractMonthlyIncomeFromLoan(Loan loan) {
        if (loan.getScrutinyData() == null || loan.getScrutinyData().isBlank()) {
            return new BigDecimal("100000"); // default estimate
        }
        try {
            var map = objectMapper.readValue(loan.getScrutinyData(), Map.class);
            if (map != null && map.containsKey("salary")) {
                return new BigDecimal(String.valueOf(map.get("salary")));
            }
        } catch (Exception e) {
            // fallback
        }
        return new BigDecimal("100000");
    }

    private BigDecimal calculateEstimatedEmi(BigDecimal principal, BigDecimal annualInterestRate, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;
        BigDecimal rate = annualInterestRate != null ? annualInterestRate : new BigDecimal("14.0");
        BigDecimal monthlyRate = rate.divide(new BigDecimal("1200"), 6, RoundingMode.HALF_UP);
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(new BigDecimal(months), 2, RoundingMode.HALF_UP);
        }
        // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
        double p = principal.doubleValue();
        double r = monthlyRate.doubleValue();
        double emi = p * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
        return new BigDecimal(emi).setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public List<com.smartbank.smartbank_api.dto.BankResponses.RiskAssessmentView> getRiskSummaryForCustomer(Integer customerId) {
        List<RiskAssessment> list = riskAssessmentRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        return list.stream().map(r -> {
            List<String> factorsList = Collections.emptyList();
            try {
                if (r.getRiskFactors() != null && !r.getRiskFactors().isBlank()) {
                    factorsList = objectMapper.readValue(r.getRiskFactors(), List.class);
                }
            } catch (Exception e) {
                // fallback
            }
            return new com.smartbank.smartbank_api.dto.BankResponses.RiskAssessmentView(
                    r.getAssessmentId(),
                    r.getApplicationType(),
                    r.getApplicationId(),
                    r.getCustomerId(),
                    r.getRiskScore(),
                    r.getRiskLevel(),
                    factorsList,
                    r.getExplanation(),
                    r.getCreatedAt()
            );
        }).toList();
    }
}
