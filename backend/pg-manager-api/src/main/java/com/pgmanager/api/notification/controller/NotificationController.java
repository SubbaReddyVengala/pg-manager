package com.pgmanager.api.notification.controller;

import com.pgmanager.api.notification.dto.NotificationRequest;
import com.pgmanager.api.notification.entity.Notification;
import com.pgmanager.api.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/send")
    public ResponseEntity<Void> sendNotification(@RequestBody NotificationRequest request) {
        notificationService.sendNotification(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<Notification>> getAlerts() {
        return ResponseEntity.ok(notificationService.getAlerts());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount() {
        return ResponseEntity.ok(notificationService.getUnreadCount());
    }

    @PostMapping("/mark-read")
    public ResponseEntity<Void> markAllRead() {
        notificationService.markAllRead();
        return ResponseEntity.ok().build();
    }
}




