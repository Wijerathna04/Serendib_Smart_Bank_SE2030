package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.entity.*;
import static com.smartbank.smartbank_api.service.BankRules.decimal;

public final class ResponseMapper {
    private ResponseMapper() {}

    public static AccountView account(Account a) {
        return account(a, null, null);
    }

    public static AccountView account(Account a, String tempUsername, String tempPassword) {
        String customerName = a.getCustomer() != null && a.getCustomer().getUser() != null ? a.getCustomer().getUser().getUsername() : null;
        String customerNic = a.getCustomer() != null ? a.getCustomer().getNic() : null;
        String cifNumber = null;
        if (a.getCustomer() != null) {
            cifNumber = a.getCustomer().getCifNumber();
            if (cifNumber == null && a.getCustomer().getCustomerId() != null) {
                cifNumber = String.format("%07d", a.getCustomer().getCustomerId() - 1);
            }
        }
        String officerId = a.getApprovedByOfficer() != null ? a.getApprovedByOfficer().getUsername() : null;
        String managerId = a.getApprovedByManager() != null ? a.getApprovedByManager().getUsername() : null;

        return new AccountView(
            a.getAccountId(),
            a.getAccountNumber(),
            a.getAccountType(),
            decimal(a.getBalance()),
            decimal(a.getBalance()),
            a.getStatus(),
            a.getOpenDate(),
            Boolean.TRUE.equals(a.getIsPrimary()),
            a.getKycData(),
            a.getRejectionReason(),
            customerName,
            customerNic,
            cifNumber,
            officerId,
            managerId,
            tempUsername,
            tempPassword
        );
    }

    public static UserView user(User u) {
        return new UserView(u.getUserId(), u.getUsername(), u.getEmail(), u.getRole().getRoleName(), u.getStatus());
    }

    public static NotificationView notification(Notification n) {
        return new NotificationView(n.getNotificationId(), n.getTitle(), n.getMessage(), n.getEventType(), n.getStatus(), n.getCreatedAt());
    }

    public static BeneficiaryView beneficiary(Beneficiary b) {
        return new BeneficiaryView(b.getBeneficiaryId(), b.getName(), b.getAccountNumber(), b.getBankName(), b.getRelationship(), b.isActive());
    }

    public static TransactionView transaction(TransactionRecord t, Integer viewer) {
        return new TransactionView(
            t.getTransactionId(),
            t.getFromAccount() == null ? null : t.getFromAccount().getAccountId(),
            t.getToAccount() == null ? null : t.getToAccount().getAccountId(),
            decimal(t.getAmount()),
            t.getTransactionType(),
            t.getStatus(),
            t.getDescription(),
            t.getCreatedAt(),
            t.getCompletedAt(),
            t.getAuthorizationExpiresAt(),
            t.getInitiatedBy() != null && t.getInitiatedBy().getUserId().equals(viewer) && "PENDING".equals(t.getStatus()),
            t.getFailureCode()
        );
    }

    public static DepositView deposit(FixedDeposit f) {
        return new DepositView(
            f.getFixedDepositId(),
            f.getAccount().getAccountId(),
            f.getAccount().getAccountNumber(),
            decimal(f.getPrincipalAmount()),
            decimal(f.getInterestRate()),
            f.getTermMonths(),
            f.getStartDate(),
            f.getMaturityDate(),
            decimal(f.getMaturityAmount()),
            f.getStatus(),
            f.getOpeningTransaction() == null ? null : f.getOpeningTransaction().getTransactionId(),
            f.getClosingTransaction() == null ? null : f.getClosingTransaction().getTransactionId(),
            f.getCreatedAt(),
            f.getFdDetails()
        );
    }

    public static BillView bill(BillPayment b) {
        return new BillView(
            b.getPaymentId(),
            b.getAccount().getAccountId(),
            b.getBillType(),
            b.getReferenceNumber(),
            decimal(b.getAmount()),
            b.getStatus(),
            b.getTransaction() == null ? null : b.getTransaction().getTransactionId(),
            b.getCreatedAt(),
            b.getCompletedAt()
        );
    }

    public static CardView card(Card c, java.time.LocalDate today) {
        return card(c, today, null, null, null, null);
    }

    public static CardView card(Card c, java.time.LocalDate today, Integer riskScore, String riskLevel, java.util.List<String> riskFactors, String riskExplanation) {
        String n = c.getCardNumber();
        String status = !"CANCELLED".equals(c.getStatus()) && c.getExpiryDate() != null && c.getExpiryDate().isBefore(today) ? "EXPIRED" : c.getStatus();
        User owner = c.getOwnerUser();
        String applicantName = c.getFullName() != null ? c.getFullName() : (owner != null ? owner.getUsername() : null);
        String applicantNic = c.getNicNumber();
        if (applicantNic == null && c.getAccount() != null && c.getAccount().getCustomer() != null) {
            applicantNic = c.getAccount().getCustomer().getNic();
        }

        return new CardView(
            c.getCardId(),
            c.getAccount() != null ? c.getAccount().getAccountId() : null,
            c.getAccount() != null ? c.getAccount().getAccountType() : "Standalone Credit Account",
            n == null ? "Not issued" : "SIM **** " + n.substring(Math.max(0, n.length() - 4)),
            c.getCardType(),
            c.getCardProduct() != null ? c.getCardProduct() : ("CREDIT".equals(c.getCardType()) ? "Platinum Credit Card" : "Standard Debit Card"),
            c.getExpiryDate(),
            status,
            c.getIssuedAt() != null,
            c.getRequestedAt(),
            c.getCreditLimit() != null ? decimal(c.getCreditLimit()) : null,
            c.getAvailableCredit() != null ? decimal(c.getAvailableCredit()) : (c.getCreditLimit() != null ? decimal(c.getCreditLimit()) : null),
            c.getCurrentBalance() != null ? decimal(c.getCurrentBalance()) : "0.00",
            applicantName,
            applicantNic,
            c.getEmploymentType(),
            c.getEmployerName(),
            c.getDesignation(),
            c.getYearsOfService(),
            c.getGrossMonthlyIncome() != null ? decimal(c.getGrossMonthlyIncome()) : null,
            c.getFixedAllowances() != null ? decimal(c.getFixedAllowances()) : null,
            c.getExistingCreditDeductions() != null ? decimal(c.getExistingCreditDeductions()) : null,
            c.getCribConsent(),
            c.getPaySlipsUpload(),
            c.getBankStatementsUpload(),
            c.getEmploymentLetterUpload(),
            riskScore,
            riskLevel,
            riskFactors,
            riskExplanation
        );
    }


    public static FeedbackView feedback(Feedback f) {
        String name = f.getCustomer() != null ? f.getCustomer().getFullName() : null;
        String username = (f.getCustomer() != null && f.getCustomer().getUser() != null) ? f.getCustomer().getUser().getUsername() : null;
        return new FeedbackView(
            f.getFeedbackId(),
            f.getFeedbackType(),
            f.getSubject(),
            f.getMessage(),
            f.getRating(),
            f.getStatus(),
            f.getStaffResponse(),
            name,
            username,
            f.getCreatedAt()
        );
    }

    public static FavouriteBillerView favouriteBiller(FavouriteBiller f) {
        return new FavouriteBillerView(
            f.getFavouriteId(),
            f.getBillerCategory(),
            f.getBillerName(),
            f.getNickname(),
            f.getReferenceNumber(),
            f.getDefaultAmount() == null ? null : decimal(f.getDefaultAmount()),
            f.getCreatedAt()
        );
    }
}
