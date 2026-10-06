package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.service.ExchangeRateService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ExchangeRateTests {
    private static final Instant NOW=Instant.parse("2026-10-02T00:00:00Z");
    static class Provider extends ExchangeRateService {
        int calls;
        boolean fail;
        Map<String,Object> response=Map.of("result","success","base_code","USD","time_last_update_unix",NOW.getEpochSecond(),"conversion_rates",Map.of("USD",1,"LKR",300,"EUR",0.9,"GBP",0.75,"AUD",1.5,"INR",84));
        Provider(Clock clock){super("test-only-key",clock);}
        @Override protected Map<String,Object> fetch(){calls++;if(fail)throw new IllegalStateException("private upstream URL");return response;}
    }
    @Test void validatesAndCachesProviderRates(){
        Provider service=new Provider(Clock.fixed(NOW,ZoneOffset.UTC));
        var data=service.latest();
        assertEquals("USD",data.base());assertEquals(300,data.rates().get("LKR").intValue());assertFalse(data.stale());
        assertSame(data,service.latest());assertEquals(1,service.calls);
        assertThrows(UnsupportedOperationException.class,()->data.rates().clear());
    }
    @Test void outageUsesExplicitlyStaleCacheAndRetriesAfterBackoff(){
        Clock clock=mock(Clock.class);when(clock.instant()).thenReturn(NOW);
        Provider service=new Provider(clock);service.latest();service.fail=true;
        when(clock.instant()).thenReturn(NOW.plus(Duration.ofHours(6)).plusSeconds(1));
        assertTrue(service.latest().stale());assertTrue(service.latest().stale());assertEquals(2,service.calls);
        service.fail=false;when(clock.instant()).thenReturn(NOW.plus(Duration.ofHours(6)).plusSeconds(62));
        assertFalse(service.latest().stale());assertEquals(3,service.calls);
    }
    @Test void refreshesOnlyWhenSixHourCacheExpires(){
        Clock clock=mock(Clock.class);when(clock.instant()).thenReturn(NOW);
        Provider service=new Provider(clock);var initial=service.latest();
        when(clock.instant()).thenReturn(NOW.plus(Duration.ofHours(6)).minusSeconds(1));
        assertSame(initial,service.latest());assertEquals(1,service.calls);
        when(clock.instant()).thenReturn(NOW.plus(Duration.ofHours(6)));
        service.latest();assertEquals(2,service.calls);
        service.latest();assertEquals(2,service.calls);
    }
    @Test void providerErrorDoesNotExposeSecretsOrInventRates(){
        Provider service=new Provider(Clock.fixed(NOW,ZoneOffset.UTC));service.fail=true;
        var error=assertThrows(ResponseStatusException.class,service::latest);
        assertEquals(503,error.getStatusCode().value());assertFalse(error.getMessage().contains("private"));
        assertThrows(ResponseStatusException.class,service::latest);assertEquals(1,service.calls);
    }
    @Test void rejectsIncompleteProviderPayload(){
        Provider service=new Provider(Clock.fixed(NOW,ZoneOffset.UTC));service.response=Map.of("result","success","base_code","USD");
        assertThrows(ResponseStatusException.class,service::latest);
    }
}
