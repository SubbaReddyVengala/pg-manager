package com.pgmanager.api.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private String recipient;
    private String subject;
    private String message;
    private String type; // EMAIL, WHATSAPP, BOTH, OVERDUE, MAINTENANCE, etc.
    private Long tenantId;
    private Long ownerId;
    private java.math.BigDecimal amount;
}




