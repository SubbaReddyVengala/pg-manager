package com.pgmanager.api.payment.client;

import com.pgmanager.api.notification.service.NotificationService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component("paymentNotificationServiceClient")
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceClient {

    private final NotificationService notificationService;

    public void send(NotificationRequest request) {
        try {
            notificationService.sendNotification(com.pgmanager.api.notification.dto.NotificationRequest.builder()
                    .recipient(request.getRecipient())
                    .subject(request.getSubject())
                    .message(request.getMessage())
                    .type(request.getType())
                    .tenantId(request.getTenantId())
                    .build());
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
