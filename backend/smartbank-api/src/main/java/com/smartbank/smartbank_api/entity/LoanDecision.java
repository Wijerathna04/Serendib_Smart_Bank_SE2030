package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="loan_decision")
@Getter @Setter
public class LoanDecision {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer decisionId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="loan_id",nullable=false) private Loan loan;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id",nullable=false) private User user;
    private String action;
    @Column(columnDefinition="text") private String reason;
    private LocalDateTime createdAt;
}
