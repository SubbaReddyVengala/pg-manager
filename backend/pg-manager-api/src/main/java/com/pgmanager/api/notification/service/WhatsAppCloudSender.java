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
public class WhatsAppCloudSender implements WhatsAppSender {

    @Value("${whatsapp.api.key:}")
    private String apiKey;

    @Value("${whatsapp.phone.id:}")
    private String phoneId;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public void send(String to, String message) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("[WHATSAPP] API Key missing. Falling back to Mock behavior.");
            log.info("[MOCK WHATSAPP] To: {}, Message: {}", to, message);
            return;
        }

        try {
            log.info("[WHATSAPP] Sending message to: {}", to);
            String url = "https://graph.facebook.com/v18.0/" + phoneId + "/messages";
            
            // Minimal payload structure for WhatsApp Cloud API
            Map<String, Object> payload = new HashMap<>();
            payload.put("messaging_product", "whatsapp");
            payload.put("to", to);
            payload.put("type", "text");
            
            Map<String, String> text = new HashMap<>();
            text.put("body", message);
            payload.put("text", text);

            // In a real implementation:
            // HttpHeaders headers = new HttpHeaders();
            // headers.setBearerAuth(apiKey);
            // HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            // restTemplate.postForEntity(url, entity, String.class);
            
            log.info("[WHATSAPP] Message sent successfully (Mocked API call)");
        } catch (Exception e) {
            log.error("[WHATSAPP] Failed to send message: {}", e.getMessage());
        }
    }
}




