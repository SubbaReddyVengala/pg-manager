package com.pgmanager.notification.service;

import com.pgmanager.notification.dto.NotificationRequest;
import com.pgmanager.notification.entity.Notification;
import java.util.List;

public interface NotificationService {
    void sendNotification(NotificationRequest req);
    List<Notification> getAlerts();
    long getUnreadCount();
    void markAllRead();
}
