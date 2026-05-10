package com.pgmanager.api.notification.service;

import com.pgmanager.api.auth.entity.PgSettings;
import com.pgmanager.api.auth.service.SettingsService;
import com.pgmanager.common.util.SecurityUtils;
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
    private final SettingsService settingsService;
    private final EmailSender emailSender;

    @Override
    @Transactional
    public void sendNotification(NotificationRequest request) {
        Long ownerId = request.getOwnerId();
        if (ownerId == null) {
            try {
                ownerId = SecurityUtils.getCurrentOwnerId();
            } catch (Exception e) {
                log.warn("Could not determine ownerId for notification: {}", request.getSubject());
            }
        }
        
        log.info("Sending notification: {} for owner: {}", request.getSubject(), ownerId);
        
        String type = request.getType();
        if (type == null) type = determineType(request.getSubject());

        // Save to DB for dashboard alerts (always)
        Notification notification = Notification.builder()
                .ownerId(ownerId)
                .title(request.getSubject())
                .message(request.getMessage())
                .type(type)
                .recipient(request.getRecipient())
                .tenantId(request.getTenantId())
                .isRead(false)
                .build();
        
        notificationRepository.save(notification);

        // Handle external email notifications based on settings
        if (ownerId != null && request.getRecipient() != null) {
            PgSettings settings = settingsService.getSettingsByOwnerId(ownerId);
            if (settings.isEmailNotifications()) {
                emailSender.send(request.getRecipient(), request.getSubject(), request.getMessage());
            }
        }
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
        return notificationRepository.findByOwnerIdOrderByCreatedAtDesc(SecurityUtils.getCurrentOwnerId());
    }

    @Override
    public long getUnreadCount() {
        return notificationRepository.countByOwnerIdAndIsReadFalse(SecurityUtils.getCurrentOwnerId());
    }

    @Override
    @Transactional
    public void markAllRead() {
        notificationRepository.markAllAsReadByOwner(SecurityUtils.getCurrentOwnerId());
    }
}




