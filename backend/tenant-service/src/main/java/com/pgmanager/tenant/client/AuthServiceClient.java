package com.pgmanager.tenant.client;

import lombok.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

@Component
@RequiredArgsConstructor
public class AuthServiceClient {

    private final RestTemplate restTemplate;

    @Value("${auth.service.url:http://127.0.0.1:8081}")
    private String authServiceUrl;

    @Value("${gateway.internal-secret:pg-internal-trust-secret-2026}")
    private String internalSecret;

    public void logEvent(Long userId, String email, String eventType, String description) {
        String url = authServiceUrl + "/auth/internal/events";
        
        AccountEvent event = AccountEvent.builder()
                .userId(userId)
                .eventType(eventType)
                .description(description)
                .performedBy(email)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Gateway-Secret", internalSecret);

        HttpEntity<AccountEvent> entity = new HttpEntity<>(event, headers);
        try {
            restTemplate.postForEntity(url, entity, Void.class);
        } catch (Exception e) {
            // Log error but don't fail business transaction
        }
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AccountEvent {
        private Long userId;
        private String eventType;
        private String description;
        private String performedBy;
    }
}
