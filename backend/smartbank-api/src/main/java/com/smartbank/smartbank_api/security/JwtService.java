package com.smartbank.smartbank_api.security;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
@Service
public class JwtService {
    private final SecretKey key;
    private final Clock clock;
    private final TokenSessionService sessions;
    private final long lifetimeHours;
    public JwtService(@Value("${jwt.secret}") String secret,@Value("${bank.security.jwt-hours:24}") long lifetimeHours,Clock clock,TokenSessionService sessions) {
        this.key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));this.clock=clock;this.sessions=sessions;this.lifetimeHours=lifetimeHours;
    }
    public String generateToken(String username) {
        String id=UUID.randomUUID().toString();Instant now=clock.instant(),expires=now.plus(Duration.ofHours(lifetimeHours));
        String token=Jwts.builder().id(id).subject(username).issuedAt(Date.from(now)).expiration(Date.from(expires)).signWith(key).compact();sessions.register(id,username,expires);return token;
    }
    public Claims claims(String token) {return Jwts.parser().verifyWith(key).clock(()->Date.from(clock.instant())).build().parseSignedClaims(token).getPayload();}
    public String extractUsername(String token) {return claims(token).getSubject();}
    public boolean validateToken(String token,String username) {try {Claims c=claims(token);return username.equals(c.getSubject()) && sessions.valid(c.getId(),username);}catch(JwtException|IllegalArgumentException e) {return false;}}
}
