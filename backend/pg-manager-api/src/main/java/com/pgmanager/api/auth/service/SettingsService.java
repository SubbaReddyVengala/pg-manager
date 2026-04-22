package com.pgmanager.api.auth.service;

import com.pgmanager.api.auth.entity.PgSettings;

public interface SettingsService {
    PgSettings getSettings();
    PgSettings updateSettings(PgSettings settings);
}
