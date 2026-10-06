package com.smartbank.smartbank_api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@Slf4j
public class SmsService {
    private static final String TEXTBEE_SEND_URL_TEMPLATE = "https://api.textbee.dev/api/v1/gateway/devices/%s/send-sms";

    private final String provider;
    private final String brand;
    private final String apiKey;
    private final String deviceId;
    private final HttpClient httpClient;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public SmsService(
            @Value("${sms.provider:SIMULATED}") String provider,
            @Value("${sms.brand:Serendib Smart Bank}") String brand,
            @Value("${textbee.api-key:}") String apiKey,
            @Value("${textbee.device-id:}") String deviceId) {
        String reqProvider = provider != null ? provider.trim().toUpperCase() : "SIMULATED";
        this.brand = (brand != null && !brand.isBlank()) ? brand.trim() : "Serendib Smart Bank";
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.deviceId = deviceId != null ? deviceId.trim() : "";
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        if ("TEXTBEE".equalsIgnoreCase(reqProvider) && !this.apiKey.isBlank() && !this.deviceId.isBlank()) {
            this.provider = "TEXTBEE";
        } else {
            this.provider = "SIMULATED";
        }

        log.info("SMS Service initialized | Provider: {} | Brand: {} | Key: {} | Device: {}",
                this.provider, this.brand, mask(this.apiKey), mask(this.deviceId));
    }

    public boolean isConfigured() {
        return "TEXTBEE".equalsIgnoreCase(provider) && !apiKey.isBlank() && !deviceId.isBlank();
    }

    public String getProviderName() {
        return provider;
    }

    public void sendOtpSms(String recipientPhone, String transactionType, String otpCode) {
        if (!isValidPhone(recipientPhone)) return;
        String typeLabel = (transactionType != null && !transactionType.isBlank()) ? transactionType : "Transaction";
        String messageBody = String.format("%s: Your OTP for %s is %s. Valid for 3 mins. Do not share.",
                brand, typeLabel, otpCode);

        dispatchAsync(recipientPhone.trim(), messageBody);
    }

    public void sendNotificationSms(String recipientPhone, String title, String message) {
        if (!isValidPhone(recipientPhone)) return;
        String summary = (message != null && !message.isBlank()) ? message : (title != null ? title : "Alert");
        if (summary.length() > 100) {
            summary = summary.substring(0, 97) + "...";
        }
        String messageBody = String.format("%s: %s", brand, summary);

        dispatchAsync(recipientPhone.trim(), messageBody);
    }

    private void dispatchAsync(String rawPhone, String messageBody) {
        String formattedPhone = formatPhone(rawPhone);
        log.info("Dispatching SMS to [{}] via {} | Length: {} chars", formattedPhone, provider, messageBody.length());
        CompletableFuture.runAsync(() -> {
            try {
                if ("TEXTBEE".equalsIgnoreCase(provider)) {
                    sendTextBeeSms(formattedPhone, messageBody);
                } else {
                    log.info("SMS Provider [SIMULATED]. Logging message locally for {}:\n{}", formattedPhone, messageBody);
                }
            } catch (Exception e) {
                log.error("Failed to send SMS via TextBee to {}: {}. Outputting locally as fallback:\n{}", formattedPhone, e.getMessage(), messageBody);
            }
        }, executor);
    }

    protected void sendTextBeeSms(String formattedPhone, String messageBody) throws Exception {
        if (apiKey.isBlank() || deviceId.isBlank()) {
            log.warn("TextBee API key or Device ID missing. Outputting message locally:\n{}", messageBody);
            return;
        }

        String sendUrl = String.format(TEXTBEE_SEND_URL_TEMPLATE, deviceId);
        String jsonPayload = String.format("{\"recipients\":[\"%s\"],\"message\":\"%s\"}",
                escapeJson(formattedPhone), escapeJson(messageBody));

        HttpRequest request = HttpRequest.newBuilder(URI.create(sendUrl))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header("x-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            log.info("TextBee SMS delivered successfully to {}", formattedPhone);
        } else {
            log.warn("TextBee API responded with status {}: {}. Outputting message locally:\n{}", response.statusCode(), response.body(), messageBody);
        }
    }

    private boolean isValidPhone(String phone) {
        if (phone == null || phone.isBlank()) return false;
        String digits = phone.replaceAll("[^0-9+]", "");
        return digits.length() >= 9;
    }

    public String formatPhone(String phone) {
        if (phone == null || phone.isBlank()) return "";
        String clean = phone.replaceAll("[^0-9+]", "");
        if (clean.startsWith("+")) {
            return clean;
        }
        if (clean.startsWith("0")) {
            return "+94" + clean.substring(1);
        }
        if (clean.startsWith("94") && clean.length() == 11) {
            return "+" + clean;
        }
        if (clean.length() == 9) {
            return "+94" + clean;
        }
        return "+94" + clean;
    }

    private String mask(String str) {
        if (str == null || str.isBlank()) return "NOT_SET";
        String trimmed = str.trim();
        if (trimmed.length() <= 4) return "****";
        return trimmed.substring(0, 2) + "***" + trimmed.substring(trimmed.length() - 2);
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
