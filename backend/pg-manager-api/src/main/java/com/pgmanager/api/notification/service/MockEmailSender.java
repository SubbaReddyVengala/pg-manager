package com.pgmanager.api.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MockEmailSender implements EmailSender {
    @Override
    public void send(String to, String subject, String body) {
        log.info("[MOCK EMAIL] To: {}, Subject: {}, Body: {}", to, subject, body);
    }
}




