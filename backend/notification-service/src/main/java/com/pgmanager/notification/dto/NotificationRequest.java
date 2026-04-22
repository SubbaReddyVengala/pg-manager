package com.pgmanager.notification.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class NotificationRequest {
    private String recipient;
    private String subject;
    private String message;
    private String type; // EMAIL, WHATSAPP, BOTH
    private Long tenantId;
}
