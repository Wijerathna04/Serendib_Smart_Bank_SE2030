package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model for Debit & Standalone Credit Cards. */
@Entity
@Table(name="card")
@Getter @Setter
public class Card {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer cardId;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id", nullable=true)
    private User user;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="account_id", nullable=true)
    private Account account;

    private String cardNumber;
    private String cardType; // "DEBIT" or "CREDIT"
    private String cardProduct; // e.g. "Serendib Platinum Credit", "Serendib Visa Gold", etc.
    private LocalDate expiryDate;
    private String status; // "PENDING", "ACTIVE", "BLOCKED", "CANCELLED"

    @Column(precision=15, scale=2)
    private BigDecimal creditLimit;

    @Column(precision=15, scale=2)
    private BigDecimal availableCredit;

    @Column(precision=15, scale=2)
    private BigDecimal currentBalance;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="issued_by")
    private User issuedBy;

    private LocalDateTime requestedAt;
    private LocalDateTime issuedAt;
    private LocalDateTime updatedAt;

    // Standalone Bank Credit Card Assessment Fields
    private String fullName;
    private String nicNumber;
    private String mobileNumber;
    private String emailAddress;
    @Column(columnDefinition = "TEXT")
    private String residentialAddress;
    private String housingStatus;
    private String employmentType;
    private String employerName;
    private String designation;
    private Integer yearsOfService;

    @Column(precision=15, scale=2)
    private BigDecimal grossMonthlyIncome;

    @Column(precision=15, scale=2)
    private BigDecimal fixedAllowances;

    @Column(precision=15, scale=2)
    private BigDecimal existingCreditDeductions;

    private String primaryBankName;
    private Boolean cribConsent;

    @Column(columnDefinition="TEXT")
    private String paySlipsUpload;

    @Column(columnDefinition="TEXT")
    private String bankStatementsUpload;

    @Column(columnDefinition="TEXT")
    private String employmentLetterUpload;

    @Version
    private long version;

    public User getOwnerUser() {
        if (this.user != null) return this.user;
        if (this.account != null && this.account.getCustomer() != null) {
            return this.account.getCustomer().getUser();
        }
        return null;
    }
}

