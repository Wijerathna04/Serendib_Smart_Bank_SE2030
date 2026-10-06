package com.smartbank.smartbank_api.service;
import java.math.*;
import org.springframework.data.domain.*;
import com.smartbank.smartbank_api.entity.Account;
import com.smartbank.smartbank_api.exception.BusinessRuleException;
public final class BankRules {
    public static final BigDecimal MAX_MONEY=new BigDecimal("9999999999.99");
    private BankRules() {}
    public static void require(boolean condition,String code,String message) {
        if(!condition) throw new BusinessRuleException(code,message);
    }
    public static BigDecimal money(BigDecimal amount) {
        require(amount!=null && amount.signum()>0 && amount.compareTo(MAX_MONEY)<=0 && amount.stripTrailingZeros().scale()<=2,
            "INVALID_AMOUNT","Amount must be positive with at most two decimal places");
        return amount.setScale(2,RoundingMode.UNNECESSARY);
    }
    public static void active(Account a) { require("ACTIVE".equals(a.getStatus()),"INACTIVE_ACCOUNT","Account is not active"); }
    public static PageRequest page(int page,int size,String sort) { return PageRequest.of(Math.max(0,page),Math.min(100,Math.max(1,size)),Sort.by(sort).descending()); }
    public static String decimal(BigDecimal value) { return value==null ? null : value.toPlainString(); }
}
