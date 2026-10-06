package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(name="ai_chat") @Getter @Setter
public class AiChat {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer chatId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="customer_id",nullable=false)
    private Customer customer;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="assistant_id",nullable=false)
    private AiAssistant assistant;
    @Column(columnDefinition="text") private String question;
    @Column(columnDefinition="text") private String response;
    private LocalDateTime createdAt;
}
