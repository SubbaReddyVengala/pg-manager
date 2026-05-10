package com.pgmanager.api.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PlatformStatsResponse {
    private long totalOwners;
    private long activeOwners;
    private long totalTenants;
    private long totalRooms;
    private BigDecimal totalRevenueThisMonth;
    private long pendingLimitRequests;
    private long openMaintenanceTickets;
}




