package com.pgmanager.auth.service;

import com.pgmanager.auth.entity.AccountEvent;
import com.pgmanager.auth.entity.User;
import com.pgmanager.auth.repository.AccountEventRepository;
import com.pgmanager.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthService {

    private final UserRepository userRepository;
    private final AccountEventRepository eventRepository;

    @Scheduled(cron = "0 0 6 * * *") // Daily at 6 AM
    public void recalculateAllHealthScores() {
        log.info("Starting daily health score recalculation...");
        List<User> users = userRepository.findAll();
        for (User user : users) {
            int score = calculateScore(user);
            user.setHealthScore(score);
            userRepository.save(user);
        }
        log.info("Finished health score recalculation.");
    }

    public int calculateScore(User user) {
        int score = 0;
        List<AccountEvent> events = eventRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        // +20 for Login in last 7 days
        if (user.getLastLoginAt() != null && user.getLastLoginAt().isAfter(LocalDateTime.now().minusDays(7))) {
            score += 20;
        }

        // +20 for having ANY rooms added (via events)
        boolean hasRooms = events.stream().anyMatch(e -> e.getEventType().equals("ROOM_ADDED"));
        if (hasRooms) score += 20;

        // +20 for having ANY tenants added (via events)
        boolean hasTenants = events.stream().anyMatch(e -> e.getEventType().equals("TENANT_ADDED"));
        if (hasTenants) score += 20;

        // +20 for having ANY payments recorded (via events)
        boolean hasPayments = events.stream().anyMatch(e -> e.getEventType().equals("PAYMENT_RECORDED"));
        if (hasPayments) score += 20;

        // +20 for profile completeness (base score if active)
        if (user.isActive()) score += 20;

        return score;
    }
}
