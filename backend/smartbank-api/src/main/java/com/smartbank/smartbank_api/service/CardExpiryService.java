package com.smartbank.smartbank_api.service;

import com.smartbank.smartbank_api.repository.CardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.Set;

@Service @RequiredArgsConstructor
public class CardExpiryService {
    private final CardRepository cards;
    private final NotificationService notifications;
    private final AuditLogService audit;
    private final Clock clock;
    @Scheduled(fixedDelay=60000) @Transactional
    public void expireCards() {
        var states=Set.of("PENDING","ACTIVE","BLOCKED");
        for(var candidate:cards.findTop100ByStatusInAndExpiryDateBefore(states,LocalDate.now(clock))) {
            var card=cards.lockById(candidate.getCardId()).orElseThrow();
            if(states.contains(card.getStatus()) && card.getExpiryDate().isBefore(LocalDate.now(clock))) {
                card.setStatus("EXPIRED");card.setUpdatedAt(LocalDateTime.now(clock));
                audit.record(null,"CARD_EXPIRED","Card",card.getCardId());
                notifications.createNotification(card.getAccount().getCustomer().getUser().getUserId(),"CARD_STATUS_CHANGED","Card expired","Your simulated card #"+card.getCardId()+" has expired.");
            }
        }
    }
}
