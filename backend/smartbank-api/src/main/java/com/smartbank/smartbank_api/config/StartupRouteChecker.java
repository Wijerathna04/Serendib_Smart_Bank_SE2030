package com.smartbank.smartbank_api.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class StartupRouteChecker implements ApplicationRunner {

    private final RequestMappingHandlerMapping handlerMapping;

    @Override
    public void run(ApplicationArguments args) {
        String buildTime = DateTimeFormatter.ISO_OFFSET_DATE_TIME
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());

        log.info("Application Startup | Server Start Time: {}", buildTime);

        Set<String> registeredGetPatterns = handlerMapping.getHandlerMethods().entrySet().stream()
                .filter(entry -> entry.getKey().getMethodsCondition().getMethods().contains(RequestMethod.GET)
                        || entry.getKey().getMethodsCondition().getMethods().isEmpty())
                .flatMap(entry -> entry.getKey().getPatternValues().stream())
                .collect(Collectors.toSet());

        List<String> routesToCheck = List.of(
                "/api/customers/me/spending-summary",
                "/api/customers/me",
                "/api/employee/accounts/all",
                "/api/admin/operations/accounts"
        );

        for (String route : routesToCheck) {
            boolean found = isRouteRegistered(route, registeredGetPatterns);
            if (found) {
                log.info("Route Check [FOUND]: GET {}", route);
            } else {
                log.warn("Route Check [MISSING]: GET {}", route);
            }
        }
    }

    private boolean isRouteRegistered(String route, Set<String> registeredPatterns) {
        if (registeredPatterns.contains(route)) {
            return true;
        }
        for (String pattern : registeredPatterns) {
            if (pattern.startsWith("/api/admin/operations/") && route.startsWith("/api/admin/operations/")) {
                return true;
            }
            if (pattern.equals(route)) {
                return true;
            }
        }
        return false;
    }
}
