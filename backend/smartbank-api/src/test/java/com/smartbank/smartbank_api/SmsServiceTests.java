package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.service.SmsService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SmsServiceTests {

    @Test
    void serviceConstructsAndHandlesTextBeeGracefully() {
        var service = new SmsService("TEXTBEE", "Serendib Smart Bank", "txb_sample_key", "sample_device");
        assertDoesNotThrow(() -> service.sendOtpSms("0701234567", "Fund Transfer", "123456"));
        assertDoesNotThrow(() -> service.sendNotificationSms("0701234567", "Security Alert", "Successful login from 127.0.0.1"));
    }

    @Test
    void serviceIgnoresInvalidPhonesWithoutThrowing() {
        var service = new SmsService("TEXTBEE", "Serendib Smart Bank", "txb_sample_key", "sample_device");
        assertDoesNotThrow(() -> service.sendOtpSms(null, "Fund Transfer", "123456"));
        assertDoesNotThrow(() -> service.sendOtpSms("123", "Fund Transfer", "123456"));
    }

    @Test
    void serviceHandlesCustomBrandPrefix() {
        var service = new SmsService("TEXTBEE", "SmartBank Demo", "txb_sample_key", "sample_device");
        assertDoesNotThrow(() -> service.sendOtpSms("+94771234567", "Bill Payment", "654321"));
    }
}
