package com.smartbank.smartbank_api.config;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.*;
@Component @ConfigurationProperties(prefix="bank.fixed-deposit") @Getter @Setter
public class FixedDepositProperties {
    /** Academic simulation values, not advertised rates from a real financial institution. */
    private Map<Integer,BigDecimal> rates=new TreeMap<>(Map.of(3,new BigDecimal("5.00"),6,new BigDecimal("6.00"),12,new BigDecimal("7.00")));
    private BigDecimal minimumAmount=new BigDecimal("1000.00");
    @jakarta.annotation.PostConstruct
    public void validate() {
        if(minimumAmount==null || minimumAmount.signum()<=0 || minimumAmount.compareTo(new BigDecimal("9999999999.99"))>0 || minimumAmount.stripTrailingZeros().scale()>2)
            throw new IllegalStateException("FD minimum amount must be a positive supported LKR amount");
        if(rates==null || rates.isEmpty() || rates.entrySet().stream().anyMatch(e->e.getKey()==null || e.getKey()<1 || e.getKey()>120 || e.getValue()==null || e.getValue().signum()<0 || e.getValue().compareTo(new BigDecimal("999.99"))>0 || e.getValue().stripTrailingZeros().scale()>2))
            throw new IllegalStateException("Configure FD terms of 1 to 120 months and decimal simulated rates between 0 and 999.99");
    }
}
