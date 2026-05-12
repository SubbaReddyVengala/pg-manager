package com.pgmanager.api.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Primary
@Slf4j
@RequiredArgsConstructor
public class GmailEmailSender implements EmailSender {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    @Override
    public void send(String to, String subject, String body) {
        if (senderEmail == null || senderEmail.isEmpty()) {
            log.warn("[GMAIL] Sender email missing. Falling back to Mock behavior.");
            log.info("[MOCK EMAIL] To: {}, Subject: {}, Body: {}", to, subject, body);
            return;
        }

        try {
            log.info("[GMAIL] Sending email to: {}", to);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            log.info("[GMAIL] Email sent successfully via Gmail SMTP");
        } catch (Exception e) {
            log.error("[GMAIL] Failed to send email: {}", e.getMessage());
        }
    }
}
