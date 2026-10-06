package com.smartbank.smartbank_api.service;
import com.smartbank.smartbank_api.repository.TransactionRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.*;
@Service @RequiredArgsConstructor
public class TransactionExpiryService {
    private final TransactionRecordRepository records;
    private final TransactionPostingService posting;
    private final Clock clock;
    @Scheduled(fixedDelayString="${bank.otp.expiry-scan-ms:60000}")
    public void expireDueRequests() { for(var t:records.findTop100ByStatusAndAuthorizationExpiresAtBefore("PENDING",LocalDateTime.now(clock))) posting.expire(t.getTransactionId()); }
}
