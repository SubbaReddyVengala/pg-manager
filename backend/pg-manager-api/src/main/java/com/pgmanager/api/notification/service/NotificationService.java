package com.pgmanager.api.notification.service;

import com.pgmanager.api.notification.dto.NotificationRequest;
import com.pgmanager.api.notification.entity.Notification;
import java.util.List;

public interface NotificationService {
    void sendNotification(NotificationRequest request);
    List<Notification> getAlerts();
    long getUnreadCount();
    void markAllRead();
}
