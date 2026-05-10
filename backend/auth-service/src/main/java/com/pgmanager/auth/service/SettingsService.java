package com.pgmanager.auth.service;

import com.pgmanager.auth.entity.PgSettings;

public interface SettingsService {
    PgSettings getSettings();
    PgSettings getSettingsByUserId(Long userId);
    PgSettings updateSettings(PgSettings settings);
}
