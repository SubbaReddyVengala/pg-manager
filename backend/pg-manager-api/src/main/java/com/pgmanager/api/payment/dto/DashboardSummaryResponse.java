package com.pgmanager.api.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private long totalRooms;
    private long occupiedRooms;
    private long availableRooms;
    private long maintenanceRooms;
    private double occupancyRate;
    private long floorCount;

    private BigDecimal monthlyRevenue;
    private BigDecimal monthlyExpenses;
    private BigDecimal monthlyProfit;
    private BigDecimal outstandingAmount;
    private double revenueGrowthRate;

    private long activeTenants;
    private long pendingTenants;
    
    private long openMaintenanceTickets;
    private long overduePaymentsCount;
}
