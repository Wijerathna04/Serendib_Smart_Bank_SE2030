package com.smartbank.smartbank_api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name="ai_assistant") @Getter @Setter
public class AiAssistant {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer assistantId;
    private String name;
    private String version;
    private String status;
}
