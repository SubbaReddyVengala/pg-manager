package com.pgmanager.api.auth.service;

import com.pgmanager.api.auth.entity.User;
import com.pgmanager.common.enums.AccountStatus;
import com.pgmanager.common.enums.Role;
import com.pgmanager.api.auth.repository.UserRepository;
import com.pgmanager.api.room.repository.RoomRepository;
import com.pgmanager.common.enums.TenantStatus;
import com.pgmanager.api.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;

    @Scheduled(cron = "0 0 6 * * *") // Daily at 6 AM
    @Transactional
    public void recalculateAllHealthScores() {
        log.info("Starting scheduled health score recalculation");
        List<User> owners = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.OWNER)
                .toList();
        
        for (User owner : owners) {
            int score = calculateScore(owner);
            owner.setHealthScore(score);
            userRepository.save(owner);
        }
        log.info("Finished recalculating health scores for {} owners", owners.size());
    }

    public int calculateScore(User owner) {
        int score = 10; // base score
        
        long rCount = roomRepository.countByOwnerId(owner.getOwnerId());
        long tCount = tenantRepository.countByOwnerIdAndStatus(owner.getOwnerId(), TenantStatus.ACTIVE);
        
        // +20 for rooms added
        if (rCount > 0) score += 20;
        
        // +20 for tenants added
        if (tCount > 0) score += 20;
        
        // +20 for active account
        if (owner.getStatus() == AccountStatus.ACTIVE) score += 20;
        
        // +20 for recent activity (login within 7 days)
        if (owner.getLastLoginAt() != null && 
            owner.getLastLoginAt().isAfter(LocalDateTime.now().minusDays(7))) {
            score += 20;
        }
        
        // +10 for room utilization > 50%
        if (rCount > 0 && (double) tCount / rCount > 0.5) {
            score += 10;
        }

        return Math.min(score, 100);
    }
}




