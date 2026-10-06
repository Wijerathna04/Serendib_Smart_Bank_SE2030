package com.smartbank.smartbank_api.security;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.*;
import java.util.concurrent.ConcurrentHashMap;
@Service
public class TokenSessionService {
    private record Session(String username,Instant expires,Instant activity) {}
    private final ConcurrentHashMap<String,Session> sessions=new ConcurrentHashMap<>();
    private final Clock clock;
    private final Duration idle;
    public TokenSessionService(Clock clock,@Value("${bank.security.idle-minutes:10}") long idleMinutes) {this.clock=clock;this.idle=Duration.ofMinutes(idleMinutes);}
    public void register(String id,String username,Instant expires) { sessions.put(id,new Session(username,expires,clock.instant())); }
    public boolean valid(String id,String username) {
        if(id==null) return false;Session s=sessions.get(id);if(s==null) return false;
        boolean valid=s.username().equals(username) && s.expires().isAfter(clock.instant()) && s.activity().plus(idle).isAfter(clock.instant());
        if(!valid) sessions.remove(id,s);return valid;
    }
    public boolean activity(String id,String username) {
        final boolean[] touched={false};
        sessions.computeIfPresent(id,(key,s)-> {if(!s.username().equals(username) || !s.expires().isAfter(clock.instant()) || !s.activity().plus(idle).isAfter(clock.instant())) return null;touched[0]=true;return new Session(s.username(),s.expires(),clock.instant());});return touched[0];
    }
    public void revoke(String id) { if(id!=null) sessions.remove(id); }
    public void revokeUser(String username) { sessions.entrySet().removeIf(e->e.getValue().username().equals(username)); }
    @Scheduled(fixedDelay=60000) public void cleanup() { sessions.entrySet().removeIf(e->!e.getValue().expires().isAfter(clock.instant()) || !e.getValue().activity().plus(idle).isAfter(clock.instant())); }
}
