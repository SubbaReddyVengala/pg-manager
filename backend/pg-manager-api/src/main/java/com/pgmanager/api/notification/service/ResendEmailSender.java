package com.pgmanager.api.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
@Primary
@Slf4j
public class ResendEmailSender implements EmailSender {

    @Value("${resend.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public void send(String to, String subject, String body) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("[RESEND] API Key missing. Falling back to Mock behavior.");
            log.info("[MOCK EMAIL] To: {}, Subject: {}, Body: {}", to, subject, body);
            return;
        }

        try {
            log.info("[RESEND] Sending email to: {}", to);
            String url = "https://api.resend.com/emails";
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", "PG Manager <onboarding@resend.dev>");
            payload.put("to", to);
            payload.put("subject", subject);
            payload.put("html", body);

            // In a real implementation, you'd add Authorization header
            // HttpHeaders headers = new HttpHeaders();
            // headers.setBearerAuth(apiKey);
            // headers.setContentType(MediaType.APPLICATION_JSON);
            // HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            // restTemplate.postForEntity(url, entity, String.class);
            
            log.info("[RESEND] Email sent successfully (Mocked API call)");
        } catch (Exception e) {
            log.error("[RESEND] Failed to send email: {}", e.getMessage());
        }
    }
}




