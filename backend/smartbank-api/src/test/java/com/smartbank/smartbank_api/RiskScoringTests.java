package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.entity.Customer;

import com.smartbank.smartbank_api.entity.Loan;

import com.smartbank.smartbank_api.repository.*;

import com.smartbank.smartbank_api.service.RiskScoringService;

import org.junit.jupiter.api.BeforeEach;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import java.time.Clock;

import java.time.Instant;

import java.time.ZoneId;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

import static org.mockito.Mockito.*;

class RiskScoringTests {

    private RiskAssessmentRepository riskAssessmentRepository;
    private AccountRepository accountRepository;
    private FixedDepositRepository fixedDepositRepository;
    private LoanRepository loanRepository;
    private CardRepository cardRepository;
    private CustomerRepository customerRepository;
    private TransactionRecordRepository transactionRecordRepository;
    private Clock clock;
    private RiskScoringService riskScoringService;

    @BeforeEach
    void setUp() {
        riskAssessmentRepository = mock(RiskAssessmentRepository.class);
        accountRepository = mock(AccountRepository.class);
        fixedDepositRepository = mock(FixedDepositRepository.class);
        loanRepository = mock(LoanRepository.class);
        cardRepository = mock(CardRepository.class);
        customerRepository = mock(CustomerRepository.class);
        transactionRecordRepository = mock(TransactionRecordRepository.class);
        clock = Clock.fixed(Instant.parse("2026-10-05T10:00:00Z"), ZoneId.of("Asia/Colombo"));

        riskScoringService = new RiskScoringService(
                riskAssessmentRepository,
                accountRepository,
                fixedDepositRepository,
                loanRepository,
                cardRepository,
                customerRepository,
                transactionRecordRepository,
                clock
        );
    }

    @Test
    void scoringBandsCategorizeCorrectly() {
        Customer customer = new Customer();
        customer.setCustomerId(1);

        com.smartbank.smartbank_api.entity.Account activeAccount = new com.smartbank.smartbank_api.entity.Account();
        activeAccount.setBalance(new BigDecimal("100000"));
        activeAccount.setOpenDate(java.time.LocalDate.now(clock.withZone(ZoneId.of("Asia/Colombo"))).minusMonths(6));

        when(accountRepository.findByCustomer_CustomerId(1)).thenReturn(List.of(activeAccount));
        when(fixedDepositRepository.findByAccount_Customer_CustomerId(1)).thenReturn(Collections.emptyList());
        when(loanRepository.findByCustomer_CustomerId(1)).thenReturn(Collections.emptyList());

        // Low risk scenario with high income and low loan amount

        var lowResult = riskScoringService.calculateRiskScore(customer, new BigDecimal("50000"), new BigDecimal("3000"), new BigDecimal("250000"));

        assertTrue(lowResult.score <= 35, "Score should be LOW band");

        assertEquals("LOW", lowResult.level);

        // High risk scenario with high EMI and no income

        var highResult = riskScoringService.calculateRiskScore(customer, new BigDecimal("5000000"), new BigDecimal("150000"), new BigDecimal("50000"));

        assertTrue(highResult.score > 35, "Score should escalate");

        assertTrue(highResult.level.equals("HIGH") || highResult.level.equals("MEDIUM"));

        assertTrue(highResult.factors.size() > 0);

    }

    @Test

    void scoringFailureNeverBlocksSubmission() {

        Loan loan = new Loan();

        loan.setLoanId(99);

        // Exception when retrieving customer will throw inside evaluateAndSaveLoan

        loan.setCustomer(null);

        var savedAssessment = riskScoringService.evaluateAndSaveLoan(loan);

        // Should return null gracefully without bubbling exception up

        assertNull(savedAssessment);

    }

}
