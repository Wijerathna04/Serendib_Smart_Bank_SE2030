package com.smartbank.smartbank_api.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.concurrent.ConcurrentHashMap;
import com.smartbank.smartbank_api.exception.ResourceNotFoundException;
@Service
public class OtpDeliveryService {
    private record Delivery(String code,LocalDateTime expires) {}
    private final ConcurrentHashMap<Integer,Delivery> mailbox=new ConcurrentHashMap<>();
    private final boolean simulation;
    private final Clock clock;
    public OtpDeliveryService(@Value("${bank.otp.simulation-enabled:false}") boolean simulation,Clock clock) { this.simulation=simulation; this.clock=clock; }
    public void deliver(Integer transactionId, String code, LocalDateTime expires) {
        if (simulation) {
            mailbox.entrySet().removeIf(e -> !e.getValue().expires().isAfter(LocalDateTime.now(clock)));
            mailbox.put(transactionId, new Delivery(code, expires));
        }
    }
    public String simulatedCode(Integer id) { Delivery d=mailbox.get(id); if(!simulation || d==null || !d.expires().isAfter(LocalDateTime.now(clock))) throw new ResourceNotFoundException(); return d.code(); }
    public void remove(Integer id) { mailbox.remove(id); }
}
