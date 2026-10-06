package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="audit_log")
@Getter @Setter
public class AuditLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer logId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id") private User user;
    private String actorType;
    private String action;
    private String entityType;
    private Integer entityId;
    private LocalDateTime performedAt;
    private String ipAddress;
}
