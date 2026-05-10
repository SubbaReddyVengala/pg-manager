package com.pgmanager.api.auth.service;

import com.pgmanager.api.auth.dto.*;
import com.pgmanager.common.dto.*;
import java.util.List;

public interface AdminService {
    OwnerProfileDTO provisionOwner(RegisterRequest request);
    List<OwnerProfileDTO> getAllOwners();
    OwnerProfileDTO getOwnerProfile(Long userId);
    OwnerStatsResponse getOwnerStats(Long userId);
    OwnerProfileDTO updateOwnerProfile(Long userId, OwnerProfileDTO updates);
    void updateOwnerStatus(Long userId, UpdateOwnerStatusRequest request);
    AuthResponse impersonateOwner(Long userId);
    void forcePasswordReset(Long userId, String reason);
    void deleteOwnerPermanently(Long userId);
    
    void sendMessage(Long userId, String message, String deliveryMode);
    
    List<UserActivityDTO> getOwnerTimeline(Long userId);
    OnboardingChecklistDTO getOnboardingChecklist(Long userId);

    List<LimitRequestDTO> getPendingLimitRequests();
    void processLimitRequest(Long requestId, String action, String adminNote);
    PlatformStatsResponse getPlatformStats();
}





