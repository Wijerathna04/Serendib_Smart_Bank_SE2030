package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="otp")
@Getter @Setter
public class Otp {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer otpId;
    @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="transaction_id",nullable=false,unique=true) private TransactionRecord transaction;
    private String otpHash;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private boolean verified;
    private LocalDateTime verifiedAt;
    private int attemptCount;
    private LocalDateTime lastSentAt;
    @Version private long version;
}
