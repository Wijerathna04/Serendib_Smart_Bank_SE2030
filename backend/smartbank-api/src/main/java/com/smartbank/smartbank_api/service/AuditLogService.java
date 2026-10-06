package com.smartbank.smartbank_api.service;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.*;
@Service @RequiredArgsConstructor
public class AuditLogService {
    private final AuditLogRepository logs;
    private final Clock clock;
    @Transactional public void record(User actor,String action,String entity,Integer id) {
        AuditLog log=new AuditLog(); log.setUser(actor); log.setActorType(actor==null?"SYSTEM_OR_ANONYMOUS":"USER");
        log.setAction(action); log.setEntityType(entity); log.setEntityId(id); log.setPerformedAt(LocalDateTime.now(clock));
        var attributes=org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        if(attributes instanceof org.springframework.web.context.request.ServletRequestAttributes request) {
            // Do not trust forwarded headers without an explicitly configured trusted proxy.
            String address=request.getRequest().getRemoteAddr();
            if(address!=null && address.length()<=50) log.setIpAddress(address);
        }
        logs.save(log);
    }
    @Transactional(propagation=Propagation.REQUIRES_NEW)
    public void recordAttempt(User actor,String action,String entity,Integer id) { record(actor,action,entity,id); }
}
