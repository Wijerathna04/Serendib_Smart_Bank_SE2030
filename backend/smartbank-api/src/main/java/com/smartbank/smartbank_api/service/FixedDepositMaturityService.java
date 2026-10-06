package com.smartbank.smartbank_api.service;
import com.smartbank.smartbank_api.repository.FixedDepositRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
@Service @RequiredArgsConstructor
public class FixedDepositMaturityService {
    private final FixedDepositRepository deposits;
    private final FixedDepositService service;
    private final Clock clock;
    @Scheduled(fixedDelayString="${bank.fixed-deposit.maturity-scan-ms:60000}") @Transactional
    public void matureDueDeposits() {
        for(var candidate:deposits.findTop100ByStatusAndMaturityDateLessThanEqual("ACTIVE",LocalDate.now(clock)))
            deposits.lockById(candidate.getFixedDepositId()).ifPresent(service::markMature);
    }
}
