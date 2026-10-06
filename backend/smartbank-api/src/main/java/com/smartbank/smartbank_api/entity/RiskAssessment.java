package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_assessment")
@Getter @Setter
public class RiskAssessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer assessmentId;

    @Column(nullable = false, length = 50)
    private String applicationType; // "LOAN" or "CARD"

    @Column(nullable = false)
    private Integer applicationId;

    @Column(nullable = false)
    private Integer customerId;

    @Column(nullable = false)
    private Integer riskScore; // 0 to 100

    @Column(nullable = false, length = 20)
    private String riskLevel; // "LOW", "MEDIUM", "HIGH"

    @Column(columnDefinition = "TEXT")
    private String riskFactors;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
