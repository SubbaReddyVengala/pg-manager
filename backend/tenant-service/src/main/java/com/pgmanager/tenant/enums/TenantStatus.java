package com.pgmanager.tenant.enums;

public enum TenantStatus {
    PENDING,   // registered but no room assigned yet
    ACTIVE,    // has a room, paying rent
    INACTIVE   // moved out
}
