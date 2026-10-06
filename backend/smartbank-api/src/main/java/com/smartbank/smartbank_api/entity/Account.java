package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="account")
@Getter @Setter
public class Account {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer accountId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="customer_id",nullable=false) private Customer customer;
    private String accountNumber;
    private String accountType;
    @Column(precision=12,scale=2,nullable=false) private BigDecimal balance;
    private LocalDate openDate;
    private String status;
    @Column(columnDefinition="TEXT") private String kycData;
    @Column(columnDefinition="TEXT") private String rejectionReason;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="approved_by_officer_id") private User approvedByOfficer;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="approved_by_manager_id") private User approvedByManager;
    @Column(name="is_primary") private Boolean isPrimary = false;
    @Version private long version;
}
