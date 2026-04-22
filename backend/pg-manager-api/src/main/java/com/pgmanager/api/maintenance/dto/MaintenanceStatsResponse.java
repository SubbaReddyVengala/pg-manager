package com.pgmanager.api.maintenance.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class MaintenanceStatsResponse {
    private long openCount;
    private long inProgressCount;
    private long resolvedCount;
    private String avgResolutionTime; // e.g., "2.3d"
}
