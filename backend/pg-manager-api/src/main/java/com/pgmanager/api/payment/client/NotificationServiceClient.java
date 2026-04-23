package com.pgmanager.api.payment.client;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component("paymentNotificationServiceClient")
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceClient {

    private final RestTemplate restTemplate;

    @Value("${notification.service.url:http://notification-service:8087/notifications}")
    private String notificationServiceUrl;

    public void send(NotificationRequest request) {
        try {
            restTemplate.postForEntity(notificationServiceUrl + "/send", request, Void.class);
            log.info("Notification sent successfully: {}", request.getSubject());
        } catch (Exception e) {
            log.error("Failed to send notification: {}", e.getMessage());
        }
    }

    @Data @Builder
    public static class NotificationRequest {
        private String recipient;
        private String subject;
        private String message;
        private String type; // EMAIL, WHATSAPP, BOTH
        private Long tenantId;
    }
}
