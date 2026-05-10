package com.pgmanager.api.auth.dto;

import lombok.Data;

@Data
public class UpdateOwnerStatusRequest {
    private String status; // ACTIVE, SUSPENDED, INACTIVE
    private String reason;
    private boolean notifyOwner;
}




