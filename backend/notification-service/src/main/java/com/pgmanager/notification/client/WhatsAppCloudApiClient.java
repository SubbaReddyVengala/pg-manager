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
import java.util.List;

@Service
@Slf4j
public class WhatsAppCloudApiClient {

    private final RestTemplate restTemplate;

    @Value("${whatsapp.api-token:wa_placeholder}")
    private String apiToken;

    @Value("${whatsapp.phone-number-id:wa_phone_id_placeholder}")
    private String phoneNumberId;

    public WhatsAppCloudApiClient() {
        this.restTemplate = new RestTemplate();
    }

    public void sendMessage(String to, String body) {
        if (apiToken == null || apiToken.startsWith("wa_placeholder") || apiToken.isEmpty()) {
            log.warn("WhatsApp Cloud API Token not configured. Skipping WhatsApp to {}", to);
            return;
        }

        String url = "https://graph.facebook.com/v18.0/" + phoneNumberId + "/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiToken);

        // Standard WhatsApp Cloud API payload for text messages
        Map<String, Object> request = new HashMap<>();
        request.put("messaging_product", "whatsapp");
        request.put("recipient_type", "individual");
        request.put("to", formatPhoneNumber(to));
        request.put("type", "text");
        
        Map<String, String> text = new HashMap<>();
        text.put("body", body);
        request.put("text", text);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            restTemplate.postForEntity(url, entity, String.class);
            log.info("WhatsApp message sent successfully via Cloud API to {}", to);
        } catch (Exception e) {
            log.error("Failed to send WhatsApp via Cloud API to {}: {}", to, e.getMessage());
        }
    }

    private String formatPhoneNumber(String phone) {
        // WhatsApp Cloud API expects numbers without '+' or 'whatsapp:' prefix
        String clean = phone.replaceAll("[^0-9]", "");
        if (clean.startsWith("91") && clean.length() == 10) return "91" + clean;
        return clean;
    }
}
