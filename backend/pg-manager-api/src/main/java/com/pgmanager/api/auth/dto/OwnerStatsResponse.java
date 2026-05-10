package com.pgmanager.api.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OwnerStatsResponse {
    private long roomsCount;
    private long tenantsCount;
    private BigDecimal collectedThisMonth;
    private long openTicketsCount;
}




