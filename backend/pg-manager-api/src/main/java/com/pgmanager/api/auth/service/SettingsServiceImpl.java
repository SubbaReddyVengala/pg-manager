package com.pgmanager.api.auth.service;

import com.pgmanager.api.auth.entity.PgSettings;
import com.pgmanager.api.auth.repository.PgSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SettingsServiceImpl implements SettingsService {

    private final PgSettingsRepository settingsRepository;

    @Override
    public PgSettings getSettings() {
        return settingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> settingsRepository.save(PgSettings.builder()
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
