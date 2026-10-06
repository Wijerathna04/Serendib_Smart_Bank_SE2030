package com.smartbank.smartbank_api.service;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import com.smartbank.smartbank_api.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
@Service @RequiredArgsConstructor @Transactional
public class TransactionService {
    private final TransactionRecordRepository transactions;
    private final CurrentUserService current;
    private final Clock clock;
    public static String fingerprint(String... parts) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(String.join("\u001f",parts).getBytes(StandardCharsets.UTF_8))); }
        catch(java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    public Optional<TransactionRecord> existing(User user,String key,String fingerprint) {
        BankRules.require(key!=null && key.matches("[A-Za-z0-9_-]{8,80}"),"IDEMPOTENCY_KEY_REQUIRED","Supply an Idempotency-Key of 8 to 80 letters, digits, hyphens or underscores");
        var old=transactions.findByInitiatedBy_UserIdAndIdempotencyKey(user.getUserId(),key);
        old.ifPresent(t->BankRules.require(fingerprint.equals(t.getRequestFingerprint()),"IDEMPOTENCY_CONFLICT","This request key was already used with different details"));
        return old;
    }
    public TransactionRecord createPending(User user,Account from,Account to,BigDecimal amount,String type,String description,String key,String fingerprint) {
        TransactionRecord t=new TransactionRecord(); t.setInitiatedBy(user); t.setFromAccount(from); t.setToAccount(to); t.setAmount(BankRules.money(amount));
        t.setTransactionType(type); t.setStatus("PENDING"); t.setDescription(description); t.setIdempotencyKey(key); t.setRequestFingerprint(fingerprint);
        t.setCreatedAt(LocalDateTime.now(clock)); t.setAuthorizationExpiresAt(LocalDateTime.now(clock).plusMinutes(10)); return transactions.save(t);
    }
    public TransactionRecord lockInitiated(Integer id,Integer userId) {
        TransactionRecord t=transactions.lockById(id).orElseThrow(ResourceNotFoundException::new);
        if(t.getInitiatedBy()==null || !t.getInitiatedBy().getUserId().equals(userId)) throw new ResourceNotFoundException(); return t;
    }
    @Transactional(readOnly=true) public TransactionView get(Integer id) {
        Integer uid=current.requireUser().getUserId(); TransactionRecord t=transactions.findById(id).orElseThrow(ResourceNotFoundException::new);
        boolean own=(t.getFromAccount()!=null && t.getFromAccount().getCustomer().getUser().getUserId().equals(uid)) || (t.getToAccount()!=null && t.getToAccount().getCustomer().getUser().getUserId().equals(uid));
        if(!own) throw new ResourceNotFoundException(); return ResponseMapper.transaction(t,uid);
    }
    @Transactional(readOnly=true) public PageResult<TransactionView> list(String type,String status,LocalDate from,LocalDate to,String search,int page,int size) {
        if(from!=null && to!=null) BankRules.require(!from.isAfter(to),"INVALID_DATES","Start date must not follow end date");
        Integer uid=current.requireUser().getUserId(); return PageResult.from(transactions.search(uid,type,status,from==null?null:from.atStartOfDay(),to==null?null:to.plusDays(1).atStartOfDay(),search,BankRules.page(page,size,"createdAt")).map(t->ResponseMapper.transaction(t,uid)));
    }
}
