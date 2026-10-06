package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="bill_payment")
@Getter @Setter
public class BillPayment {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer paymentId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="customer_id",nullable=false) private Customer customer;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="account_id",nullable=false) private Account account;
    @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="transaction_id",unique=true) private TransactionRecord transaction;
    private String referenceNumber;
    private String billType;
    @Column(precision=12,scale=2) private BigDecimal amount;
    private LocalDate paymentDate;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    @Version private long version;
}
