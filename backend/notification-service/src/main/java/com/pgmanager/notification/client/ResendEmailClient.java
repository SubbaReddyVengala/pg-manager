package com.pgmanager.notification.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class ResendEmailClient {

    private final RestTemplate restTemplate;

    @Value("${resend.api-key:re_placeholder}")
    private String apiKey;

    @Value("${resend.from-email:noreply@pgmanager.com}")
    private String fromEmail;

    public ResendEmailClient() {
        this.restTemplate = new RestTemplate();
    }

    public void sendEmail(String to, String subject, String body) {
        if (apiKey == null || apiKey.startsWith("re_placeholder") || apiKey.isEmpty()) {
            log.warn("Resend API Key not configured. Skipping email to {}", to);
            return;
        }

        String url = "https://api.resend.com/emails";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> request = new HashMap<>();
        request.put("from", fromEmail);
        request.put("to", to);
        request.put("subject", subject);
        request.put("html", body); // Resend prefers HTML

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            restTemplate.postForEntity(url, entity, String.class);
            log.info("Email sent successfully via Resend to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email via Resend to {}: {}", to, e.getMessage());
        }
    }
}
