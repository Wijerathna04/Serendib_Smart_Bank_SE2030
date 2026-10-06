package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Shared persistence model. Controllers expose DTOs, never this entity. */
@Entity
@Table(name="employee")
@Getter @Setter
public class Employee {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer employeeId;
    @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id", nullable=false, unique=true) private User user;
    private String department;
    private String position;
    private LocalDate dateJoined;
}
