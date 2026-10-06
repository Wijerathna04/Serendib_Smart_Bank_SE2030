package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="feedback")
@Getter @Setter
public class Feedback {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer feedbackId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="customer_id",nullable=false) private Customer customer;
    private String feedbackType;
    private String subject;
    @Column(columnDefinition="text") private String message;
    private Integer rating;
    private String status;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="moderator_id") private User moderator;
    @Column(columnDefinition="text") private String staffResponse;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @Version private long version;
}
