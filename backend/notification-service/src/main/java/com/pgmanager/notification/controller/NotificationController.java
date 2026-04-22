package com.pgmanager.notification.controller;

import com.pgmanager.notification.dto.NotificationRequest;
import com.pgmanager.notification.entity.Notification;
import com.pgmanager.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // POST /notifications/send - Send a new notification
    @PostMapping("/send")
    public ResponseEntity<Void> sendNotification(@RequestBody NotificationRequest request) {
        notificationService.sendNotification(request);
        return ResponseEntity.ok().build();
    }

    // GET /notifications/alerts - Get all persistent alerts
    @GetMapping("/alerts")
    public ResponseEntity<List<Notification>> getAlerts() {
        return ResponseEntity.ok(notificationService.getAlerts());
    }

    // GET /notifications/unread-count - Get unread alert count
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount());
    }

    // POST /notifications/mark-read - Mark all alerts as read
    @PostMapping("/mark-read")
    public ResponseEntity<Void> markAllRead() {
        notificationService.markAllRead();
        return ResponseEntity.ok().build();
    }
}
