package com.pgmanager.tenant.dto;
import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class TenantStatsResponse {
    private long active;
    private long pending;
    private long inactive;
    private long moveOutsThisMonth;  // move_out_date in current month
}
