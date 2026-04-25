package com.pgmanager.api.notification.service;

import com.pgmanager.api.notification.dto.NotificationRequest;
import com.pgmanager.api.notification.entity.Notification;
import com.pgmanager.api.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void sendNotification(NotificationRequest request) {
        log.info("Sending notification: {}", request.getSubject());
        
        String type = request.getType();
        if (type == null || "BOTH".equalsIgnoreCase(type) || "EMAIL".equalsIgnoreCase(type) || "WHATSAPP".equalsIgnoreCase(type)) {
            type = determineType(request.getSubject());
        }

        Notification notification = Notification.builder()
                .title(request.getSubject())
                .message(request.getMessage())
                .type(type)
                .recipient(request.getRecipient())
                .tenantId(request.getTenantId())
                .isRead(false)
                .build();
        
        notificationRepository.save(notification);
    }

    private String determineType(String subject) {
        if (subject == null) return "REMINDER";
        String s = subject.toUpperCase();
        if (s.contains("OVERDUE") || s.contains("LATE")) return "OVERDUE";
        if (s.contains("MAINTENANCE") || s.contains("COMPLAINT") || s.contains("TICKET")) return "MAINTENANCE";
        if (s.contains("PAYMENT") || s.contains("RECEIVED") || s.contains("RECEIPT")) return "PAYMENT";
        if (s.contains("MOVE-OUT") || s.contains("VACATE")) return "MOVE_OUT";
        return "REMINDER";
    }

    @Override
    public List<Notification> getAlerts() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public long getUnreadCount() {
        return notificationRepository.countByIsReadFalse();
    }

    @Override
    @Transactional
    public void markAllRead() {
        notificationRepository.markAllAsRead();
    }
}
