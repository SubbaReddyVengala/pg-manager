package com.pgmanager.api.maintenance.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder
public class NetProfitResponse {
    private LocalDate month;
    private BigDecimal totalRevenue;
    private BigDecimal totalMaintenanceCost;
    private BigDecimal totalGeneralExpenses;
    private BigDecimal netProfit;
}
