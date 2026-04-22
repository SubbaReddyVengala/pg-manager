package com.pgmanager.api.auth.controller;

import com.pgmanager.api.auth.entity.PgSettings;
import com.pgmanager.api.auth.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<PgSettings> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PgSettings> updateSettings(@RequestBody PgSettings settings) {
        return ResponseEntity.ok(settingsService.updateSettings(settings));
    }
}
