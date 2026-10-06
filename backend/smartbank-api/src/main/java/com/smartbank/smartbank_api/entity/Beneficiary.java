package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="beneficiary")
@Getter @Setter
public class Beneficiary {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer beneficiaryId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="customer_id",nullable=false) private Customer customer;
    private String name;
    private String accountNumber;
    private String bankName;
    private String relationship;
    private boolean active = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @Version private long version;
}
