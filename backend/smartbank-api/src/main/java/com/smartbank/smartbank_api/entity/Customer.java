package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name = "customer")
@Getter
@Setter
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer customerId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "cif_number", unique = true)
    private String cifNumber;

    private String nic;
    private String fullName;
    @Column(columnDefinition = "TEXT")
    private String address;
    private LocalDate dateOfBirth;

    // Document and profile image fields
    @jakarta.persistence.Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage;

    @jakarta.persistence.Column(name = "nic_front_image", columnDefinition = "TEXT")
    private String nicFrontImage;

    @jakarta.persistence.Column(name = "nic_back_image", columnDefinition = "TEXT")
    private String nicBackImage;
}