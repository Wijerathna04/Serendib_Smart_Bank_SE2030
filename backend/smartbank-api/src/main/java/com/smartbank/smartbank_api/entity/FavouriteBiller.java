package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "favourite_biller")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class FavouriteBiller {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "favourite_id")
    private Integer favouriteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "biller_category", nullable = false, length = 50)
    private String billerCategory;

    @Column(name = "biller_name", nullable = false, length = 100)
    private String billerName;

    @Column(name = "nickname", nullable = false, length = 100)
    private String nickname;

    @Column(name = "reference_number", nullable = false, length = 50)
    private String referenceNumber;

    @Column(name = "default_amount", precision = 12, scale = 2)
    private BigDecimal defaultAmount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
