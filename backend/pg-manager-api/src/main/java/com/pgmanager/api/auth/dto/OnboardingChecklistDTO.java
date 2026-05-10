package com.pgmanager.api.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OnboardingChecklistDTO {
    private boolean provisioned;
    private boolean emailDelivered;
    private boolean firstLoginCompleted;
    private boolean passwordChanged;
    private boolean profileSetup;
    private boolean firstRoomAdded;
    private boolean firstTenantAdded;
}




