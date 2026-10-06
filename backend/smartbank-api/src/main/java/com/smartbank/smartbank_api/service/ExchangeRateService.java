package com.smartbank.smartbank_api.service;

import java.time.*;
import java.util.*;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExchangeRateService {
    public record Rates(String base, Map<String, BigDecimal> rates, Instant updatedAt, boolean stale) {}
    private final String key;
    private final Clock clock;
    private final RestClient client;
    private Rates cached;
    private Instant retryAt = Instant.EPOCH;

    public ExchangeRateService(@Value("${exchange-rate.api-key:}") String key, Clock clock) {
        this.key = key;
        this.clock = clock;
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        client = RestClient.builder().requestFactory(factory).build();
    }

    protected Map<String, Object> fetch() {
        return client.get().uri("https://v6.exchangerate-api.com/v6/{key}/latest/USD", key)
            .retrieve().body(new ParameterizedTypeReference<Map<String, Object>>() {});
    }

    public synchronized Rates latest() {
        Instant now = clock.instant();
        if (now.isBefore(retryAt)) {
            if (cached != null) {
                boolean isStale = now.isAfter(cached.updatedAt().plus(Duration.ofHours(6)));
                if (isStale == cached.stale()) {
                    return cached;
                }
                return new Rates(cached.base(), cached.rates(), cached.updatedAt(), isStale);
            }
            throw unavailable();
        }

        try {
            if (!key.isBlank()) {
                var data = fetch();
                if (data != null && "success".equals(data.get("result")) && "USD".equals(data.get("base_code"))) {
                    var raw = (Map<?, ?>) data.get("conversion_rates");
                    var values = new LinkedHashMap<String, BigDecimal>();
                    for (Map.Entry<?, ?> entry : raw.entrySet()) {
                        try {
                            BigDecimal val = new BigDecimal(entry.getValue().toString());
                            if (val.signum() > 0) {
                                values.put(entry.getKey().toString(), val);
                            }
                        } catch (Exception ignored) {}
                    }
                    if (values.containsKey("LKR") && values.containsKey("USD")) {
                        Instant updated = Instant.ofEpochSecond(((Number) data.get("time_last_update_unix")).longValue());
                        cached = new Rates("USD", Collections.unmodifiableMap(values), updated, false);
                        retryAt = now.plus(Duration.ofHours(6));
                        return cached;
                    }
                }
            }
        } catch (Exception ignored) {
            retryAt = now.plusSeconds(60);
        }

        if (cached != null) {
            boolean isStale = now.isAfter(cached.updatedAt().plus(Duration.ofHours(6)));
            if (isStale == cached.stale()) {
                return cached;
            }
            return new Rates(cached.base(), cached.rates(), cached.updatedAt(), isStale);
        }
        throw unavailable();
    }

    private ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Exchange rates are temporarily unavailable");
    }
}
