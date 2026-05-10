package com.pgmanager.api.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MockWhatsAppSender implements WhatsAppSender {
    @Override
    public void send(String phone, String message) {
        log.info("[MOCK WHATSAPP] Phone: {}, Message: {}", phone, message);
    }
}




