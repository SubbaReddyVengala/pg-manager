package com.pgmanager.api.auth.controller;

import com.pgmanager.api.auth.dto.*;
import com.pgmanager.common.dto.*;
import com.pgmanager.api.auth.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/provision")
    public ResponseEntity<OwnerProfileDTO> provisionOwner(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(adminService.provisionOwner(request));
    }

    @GetMapping("/owners")
    public ResponseEntity<List<OwnerProfileDTO>> getAllOwners() {
        return ResponseEntity.ok(adminService.getAllOwners());
    }

    @GetMapping("/owners/{id}/profile")
    public ResponseEntity<OwnerProfileDTO> getOwnerProfile(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getOwnerProfile(id));
    }

    @GetMapping("/owners/{id}/stats")
    public ResponseEntity<OwnerStatsResponse> getOwnerStats(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getOwnerStats(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<PlatformStatsResponse> getPlatformStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }

    @PutMapping("/owners/{id}/profile")
    public ResponseEntity<OwnerProfileDTO> updateOwnerProfile(@PathVariable Long id, @RequestBody OwnerProfileDTO updates) {
        return ResponseEntity.ok(adminService.updateOwnerProfile(id, updates));
    }

    @PostMapping("/owners/{id}/status")
    public ResponseEntity<Void> updateOwnerStatus(@PathVariable Long id, @RequestBody UpdateOwnerStatusRequest request) {
        adminService.updateOwnerStatus(id, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/owners/{id}/impersonate")
    public ResponseEntity<AuthResponse> impersonateOwner(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.impersonateOwner(id));
    }

    @PostMapping("/owners/{id}/force-reset")
    public ResponseEntity<Void> forcePasswordReset(@PathVariable Long id, @RequestParam String reason) {
        adminService.forcePasswordReset(id, reason);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/owners/{id}")
    public ResponseEntity<Void> deleteOwnerPermanently(@PathVariable Long id) {
        adminService.deleteOwnerPermanently(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/owners/{id}/message")
    public ResponseEntity<Void> sendMessage(@PathVariable Long id, @RequestParam String message, @RequestParam String mode) {
        adminService.sendMessage(id, message, mode);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/owners/{id}/timeline")
    public ResponseEntity<List<UserActivityDTO>> getOwnerTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getOwnerTimeline(id));
    }

    @GetMapping("/owners/{id}/onboarding-checklist")
    public ResponseEntity<OnboardingChecklistDTO> getOnboardingChecklist(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getOnboardingChecklist(id));
    }

    @GetMapping("/limit-requests")
    public ResponseEntity<List<LimitRequestDTO>> getPendingLimitRequests() {
        return ResponseEntity.ok(adminService.getPendingLimitRequests());
    }

    @PostMapping("/limit-requests/{id}/process")
    public ResponseEntity<Void> processLimitRequest(
            @PathVariable Long id, 
            @RequestParam String action, 
            @RequestParam(required = false) String adminNote) {
        adminService.processLimitRequest(id, action, adminNote);
        return ResponseEntity.ok().build();
    }
}





