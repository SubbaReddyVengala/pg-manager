package com.pgmanager.auth.service;

import com.pgmanager.auth.entity.PgSettings;
import com.pgmanager.auth.entity.User;
import com.pgmanager.auth.repository.PgSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SettingsServiceImpl implements SettingsService {

    private final PgSettingsRepository settingsRepository;

    private Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        throw new RuntimeException("User not authenticated");
    }

    @Override
    public PgSettings getSettings() {
        return getSettingsByUserId(getCurrentUserId());
    }

    @Override
    public PgSettings getSettingsByUserId(Long userId) {
        return settingsRepository.findByUserId(userId)
                .orElseGet(() -> settingsRepository.save(PgSettings.builder()
                        .userId(userId)
                        .pgName("My PG Hostel")
                        .ownerName("PG Owner")
                        .phone("9876543210")
                        .address("Location, City")
                        .build()));
    }

    @Override
    public PgSettings updateSettings(PgSettings req) {
        PgSettings existing = getSettings();
        existing.setPgName(req.getPgName());
        existing.setOwnerName(req.getOwnerName());
        existing.setPhone(req.getPhone());
        existing.setAddress(req.getAddress());
        
        existing.setWhatsappReminders(req.isWhatsappReminders());
        existing.setEmailNotifications(req.isEmailNotifications());
        existing.setOverdueAlerts(req.isOverdueAlerts());
        existing.setMaintenanceAlerts(req.isMaintenanceAlerts());
        existing.setMonthlyReportEmail(req.isMonthlyReportEmail());
        
        existing.setDefaultRentDueDay(req.getDefaultRentDueDay());
        existing.setLateFeeAfterDays(req.getLateFeeAfterDays());
        existing.setLateFeeAmount(req.getLateFeeAmount());
        
        return settingsRepository.save(existing);
    }
}
