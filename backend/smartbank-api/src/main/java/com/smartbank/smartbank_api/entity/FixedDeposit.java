package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="fixed_deposit")
@Getter @Setter
public class FixedDeposit {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer fixedDepositId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="account_id",nullable=false) private Account account;
    @Column(precision=12,scale=2) private BigDecimal principalAmount;
    @Column(precision=5,scale=2) private BigDecimal interestRate;
    private Integer termMonths;
    private LocalDate startDate;
    private LocalDate maturityDate;
    @Column(precision=12,scale=2) private BigDecimal maturityAmount;
    private String status;
    @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="opening_transaction_id",unique=true) private TransactionRecord openingTransaction;
    @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="closing_transaction_id",unique=true) private TransactionRecord closingTransaction;
    @Column(columnDefinition="TEXT") private String fdDetails;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @Version private long version;
}
