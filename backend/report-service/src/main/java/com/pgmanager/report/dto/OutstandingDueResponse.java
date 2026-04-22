package com.pgmanager.report.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder
public class OutstandingDueResponse {
    private String tenantName;
    private String roomNumber;
    private BigDecimal amountDue;
    private long daysOverdue;
    private LocalDate lastReminder;
}
