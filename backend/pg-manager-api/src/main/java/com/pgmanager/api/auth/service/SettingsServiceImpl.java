package com.pgmanager.api.auth.service;

import com.pgmanager.api.auth.entity.PgSettings;
import com.pgmanager.api.auth.repository.PgSettingsRepository;
import com.pgmanager.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsServiceImpl implements SettingsService {

    private final PgSettingsRepository settingsRepository;
    private final com.pgmanager.api.auth.repository.LimitRequestRepository limitRequestRepository;
    private final com.pgmanager.api.auth.repository.OwnerProfileRepository ownerProfileRepository;

    @Override
    public PgSettings getSettings() {
        return getSettingsByOwnerId(SecurityUtils.getCurrentOwnerId());
    }

    @Override
    public PgSettings getSettingsByOwnerId(Long ownerId) {
        return settingsRepository.findByOwnerId(ownerId)
                .orElseGet(() -> settingsRepository.save(PgSettings.builder()
                        .ownerId(ownerId)
                        .pgName("My PG Hostel")
                        .ownerName("PG Owner")
                        .phone("9876543210")
                        .address("Location, City")
                        .build()));
    }

    @Override
    @Transactional
    public PgSettings updateSettings(PgSettings req) {
        PgSettings existing = getSettings();
        existing.setPgName(req.getPgName());
        existing.setOwnerName(req.getOwnerName());
        existing.setPhone(req.getPhone());
        existing.setAddress(req.getAddress());
        existing.setUpiId(req.getUpiId());
        
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

    @Override
    @Transactional
    public void submitLimitRequest(com.pgmanager.api.auth.dto.LimitRequestDTO req) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        
        if (limitRequestRepository.existsByOwnerIdAndRequestTypeAndStatus(ownerId, req.getRequestType(), "PENDING")) {
            throw new RuntimeException("You already have a pending request for " + req.getRequestType());
        }

        com.pgmanager.api.auth.entity.OwnerProfile profile = ownerProfileRepository.findByUserId(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner profile not found"));
        
        int currentLimit = "ROOMS".equalsIgnoreCase(req.getRequestType()) ? profile.getMaxRooms() : profile.getMaxTenants();

        com.pgmanager.api.auth.entity.LimitRequest entity = com.pgmanager.api.auth.entity.LimitRequest.builder()
                .ownerId(ownerId)
                .requestType(req.getRequestType())
                .currentLimit(currentLimit)
                .requestedLimit(req.getRequestedLimit())
                .status("PENDING")
                .build();
        
        limitRequestRepository.save(entity);
    }
}




