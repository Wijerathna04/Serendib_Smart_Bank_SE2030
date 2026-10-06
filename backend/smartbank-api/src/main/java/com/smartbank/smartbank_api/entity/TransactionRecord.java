package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="transaction_record")
@Getter @Setter
public class TransactionRecord {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer transactionId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="from_account_id") private Account fromAccount;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="to_account_id") private Account toAccount;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="initiated_by") private User initiatedBy;
    @Column(precision=12,scale=2) private BigDecimal amount;
    private String transactionType;
    private String status;
    private String description;
    private String idempotencyKey;
    private String requestFingerprint;
    private String failureCode;
    private String billType;
    private String billReference;
    private String externalBank;
    private String externalAccountNumber;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private LocalDateTime authorizationExpiresAt;
    @Version private long version;
}
