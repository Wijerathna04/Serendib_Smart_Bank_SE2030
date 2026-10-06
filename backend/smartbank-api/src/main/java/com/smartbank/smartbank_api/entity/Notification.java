package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="notification")
@Getter @Setter
public class Notification {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer notificationId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id",nullable=false) private User user;
    private String title;
    @Column(columnDefinition="text") private String message;
    private String eventType;
    private String status;
    private LocalDateTime createdAt;
    @Version private long version;
}
