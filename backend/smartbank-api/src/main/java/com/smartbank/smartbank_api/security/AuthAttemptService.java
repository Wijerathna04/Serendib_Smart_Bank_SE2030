package com.smartbank.smartbank_api.security;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import lombok.RequiredArgsConstructor;
import java.time.*;
import java.util.concurrent.ConcurrentHashMap;
import com.smartbank.smartbank_api.exception.BusinessRuleException;
@Service @RequiredArgsConstructor
public class AuthAttemptService {
    private record Window(Instant start,int attempts) {}
    private final ConcurrentHashMap<String,Window> windows=new ConcurrentHashMap<>();
    private final Clock clock;
    public void check(String key,int maximum) {
        Window w=windows.compute(key,(k,old)->old==null || !old.start().plusSeconds(60).isAfter(clock.instant())?new Window(clock.instant(),1):new Window(old.start(),old.attempts()+1));
        if(w.attempts()>maximum) throw new BusinessRuleException("RATE_LIMITED","Too many attempts. Please wait a minute.");
    }
    @Scheduled(fixedDelay=60000) public void cleanup() {windows.entrySet().removeIf(e->!e.getValue().start().plusSeconds(60).isAfter(clock.instant()));}
}
