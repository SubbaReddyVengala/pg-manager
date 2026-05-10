package com.pgmanager.api.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GlobalSummaryResponse {
    private int totalOwners;
    private BigDecimal totalRevenue;
    private int totalRooms;
    private int totalTenants;
    private double systemHealth; // Placeholder for now
}
