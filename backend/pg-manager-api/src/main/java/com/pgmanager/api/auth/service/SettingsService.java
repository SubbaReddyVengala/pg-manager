package com.pgmanager.api.auth.service;

import com.pgmanager.api.auth.entity.PgSettings;

public interface SettingsService {
    PgSettings getSettings();
    PgSettings getSettingsByOwnerId(Long ownerId);
    PgSettings updateSettings(PgSettings settings);
    void submitLimitRequest(com.pgmanager.api.auth.dto.LimitRequestDTO request);
}




