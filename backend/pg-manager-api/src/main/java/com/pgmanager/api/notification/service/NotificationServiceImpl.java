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
                // Ignore for system notifications
            }
        }
        
        if (ownerId == null) ownerId = 0L;

        String type = request.getType();
        if (type == null) type = determineType(request.getSubject());

        // 1. Try to save to DB (but don't let it block the email)
        try {
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
        } catch (Exception e) {
            log.warn("Failed to save notification to DB: {}. Proceeding with email.", e.getMessage());
        }

        // 2. Handle external email notifications
        if (request.getRecipient() != null) {
            boolean isCritical = request.getSubject() != null && 
                                (request.getSubject().contains("Password") || 
                                 request.getSubject().contains("Activated") || 
                                 request.getSubject().contains("Welcome"));

            boolean shouldSend = isCritical;
            if (!shouldSend && ownerId != 0L) {
                try {
                    PgSettings settings = settingsService.getSettingsByOwnerId(ownerId);
                    shouldSend = settings.isEmailNotifications();
                } catch (Exception e) {
                    log.warn("Could not load settings for owner {}: {}", ownerId, e.getMessage());
                }
            }

            if (shouldSend) {
                log.info("Dispatching email to: {}", request.getRecipient());
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




