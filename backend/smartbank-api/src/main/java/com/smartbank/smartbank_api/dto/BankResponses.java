package com.smartbank.smartbank_api.dto;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Explicit projections prevent entity graphs and credentials from leaking into
 * JSON.
 */
public final class BankResponses {
    private BankResponses() {
    }

    public record PageResult<T>(List<T> content, int page, int size, long totalElements, int totalPages) {
        public static <T> PageResult<T> from(Page<T> p) {
            return new PageResult<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(),
                    p.getTotalPages());
        }
    }

    public record AccountView(
            Integer accountId,
            String accountNumber,
            String accountType,
            String balance,
            String availableBalance,
            String status,
            LocalDate openDate,
            Boolean isPrimary,
            String kycData,
            String rejectionReason,
            String customerName,
            String customerNic,
            String cifNumber,
            String approvedByOfficerId,
            String approvedByManagerId,
            String tempUsername,
            String tempPassword) {
    }

    public record NotificationView(
            Integer notificationId,
            String title,
            String message,
            String eventType,
            String status,
            LocalDateTime createdAt) {
    }

    public record FinancialStatsView(
            int totalAccounts,
            BigDecimal totalAccountBalance,
            int totalFixedDepositsCount,
            BigDecimal totalFixedDepositAmount,
            int totalLoansCount,
            BigDecimal totalLoanBalance,
            int totalCardsCount,
            long totalTransactionsCount,
            BigDecimal totalDeposits,
            BigDecimal totalWithdrawals,
            BigDecimal netFlow) {
    }

    public record ProfileView(
            Integer userId,
            Integer customerId,
            String cifNumber,
            String username,
            String email,
            String phone,
            String role,
            String status,
            String nic,
            String address,
            LocalDate dateOfBirth,
            String profileImage,
            String nicFrontImage,
            String nicBackImage,
            String fullName,
            String userCategory,
            FinancialStatsView financialStats,
            Boolean mustChangePassword) {
    }

    public record UserView(Integer userId, String username, String email, String role, String status) {
    }

    public record BeneficiaryView(
            Integer beneficiaryId,
            String name,
            String accountNumber,
            String bankName,
            String relationship,
            boolean active) {
    }

    public record TransactionView(
            Integer transactionId,
            Integer fromAccountId,
            Integer toAccountId,
            String amount,
            String transactionType,
            String status,
            String description,
            LocalDateTime createdAt,
            LocalDateTime completedAt,
            LocalDateTime authorizationExpiresAt,
            boolean canAuthorize,
            String failureCode) {
    }

    public record DepositView(
            Integer fixedDepositId,
            Integer accountId,
            String accountNumber,
            String principalAmount,
            String interestRate,
            Integer termMonths,
            LocalDate startDate,
            LocalDate maturityDate,
            String maturityAmount,
            String status,
            Integer openingTransactionId,
            Integer closingTransactionId,
            LocalDateTime createdAt,
            String fdDetails) {
    }

    public record BillView(
            Integer paymentId,
            Integer accountId,
            String billType,
            String referenceNumber,
            String amount,
            String status,
            Integer transactionId,
            LocalDateTime createdAt,
            LocalDateTime completedAt) {
    }

    public record FavouriteBillerView(
            Integer favouriteId,
            String billerCategory,
            String billerName,
            String nickname,
            String referenceNumber,
            String defaultAmount,
            LocalDateTime createdAt) {
    }

    public record LoanDecisionView(String action, String reason, String actor, LocalDateTime createdAt) {
    }

    public record LoanView(
            Integer loanId,
            String loanNumber,
            String customer,
            String customerNic,
            String cifNumber,
            String loanType,
            String amount,
            String interestRate,
            String status,
            String information,
            String scrutinyData,
            LocalDate applyDate,
            List<LoanDecisionView> decisions,
            String approvedByOfficerId,
            String approvedByManagerId,
            Integer targetAccountId,
            String targetAccountNumber,
            Integer fixedDepositId,
            String paidAmount,
            String remainingAmount,
            Integer riskScore,
            String riskLevel,
            List<String> riskFactors,
            String riskExplanation) {
    }

    public record CardView(
            Integer cardId,
            Integer accountId,
            String accountType,
            String cardNumber,
            String cardType,
            String cardProduct,
            LocalDate expiryDate,
            String status,
            boolean issued,
            LocalDateTime requestedAt,
            String creditLimit,
            String availableCredit,
            String currentBalance,
            String applicantName,
            String applicantNic,
            String employmentType,
            String employerName,
            String designation,
            Integer yearsOfService,
            String grossMonthlyIncome,
            String fixedAllowances,
            String existingCreditDeductions,
            Boolean cribConsent,
            String paySlipsUpload,
            String bankStatementsUpload,
            String employmentLetterUpload,
            Integer riskScore,
            String riskLevel,
            List<String> riskFactors,
            String riskExplanation) {
    }

    public record RiskAssessmentView(
            Integer assessmentId,
            String applicationType,
            Integer applicationId,
            Integer customerId,
            Integer riskScore,
            String riskLevel,
            List<String> riskFactors,
            String explanation,
            LocalDateTime createdAt) {
    }


    public record FeedbackView(
            Integer feedbackId,
            String feedbackType,
            String subject,
            String message,
            Integer rating,
            String status,
            String staffResponse,
            String customerName,
            String customerUsername,
            LocalDateTime createdAt) {
    }

    public record ReviewView(Integer feedbackId, String subject, String message, Integer rating,
            LocalDateTime createdAt) {
    }

    public record ReviewSummary(Double averageRating, long totalReviews) {
    }

    public record AuditView(Integer logId, String actor, String action, String entityType, Integer entityId,
            LocalDateTime performedAt) {
    }

    public record CustomerSearchResult(
            boolean exists,
            Integer customerId,
            Integer userId,
            String cifNumber,
            String nic,
            String fullName,
            String email,
            String phone,
            String address,
            LocalDate dateOfBirth,
            String nextCifNumber) {
    }

    public record CategorySummaryRaw(String transactionType, java.math.BigDecimal totalAmount, Long count) {}
    public record SpendingCategoryView(String key, String label, String amount, int percent, long count) {}
    public record SpendingSummaryView(String monthKey, String monthLabel, String currency, String total, int daysUntilReset, String generatedAt, List<SpendingCategoryView> categories) {}
}