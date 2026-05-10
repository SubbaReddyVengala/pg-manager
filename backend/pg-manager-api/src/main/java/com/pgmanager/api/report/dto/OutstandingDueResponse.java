package com.pgmanager.api.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OutstandingDueResponse {
    private String tenantName;
    private String roomNumber;
    private BigDecimal amountDue;
    private long daysOverdue;
    private String lastReminder;
}




