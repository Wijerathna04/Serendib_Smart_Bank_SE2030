package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="loan")
@Getter @Setter
public class Loan {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer loanId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="customer_id",nullable=false) private Customer customer;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="reviewer_employee_id") private Employee reviewerEmployee;
    @Column(name="loan_number") private String loanNumber;
    private String loanType;
    @Column(precision=12,scale=2) private BigDecimal amount;
    @Column(precision=5,scale=2) private BigDecimal interestRate;
    @Column(length=40) private String status;
    private LocalDate applyDate;
    private LocalDate reviewDate;
    @Column(columnDefinition="text") private String additionalInformation;
    @Column(columnDefinition="text") private String scrutinyData;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="account_id") private Account targetAccount;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="fixed_deposit_id") private FixedDeposit fixedDeposit;
    @Column(precision=12,scale=2) private BigDecimal paidAmount = BigDecimal.ZERO;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="approved_by_officer_id") private User approvedByOfficer;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="approved_by_manager_id") private User approvedByManager;
    private LocalDateTime updatedAt;
    @Version private long version;
}
