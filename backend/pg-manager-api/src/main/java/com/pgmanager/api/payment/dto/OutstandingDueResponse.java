package com.pgmanager.api.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutstandingDueResponse {
    private String tenantName;
    private String roomNumber;
    private BigDecimal amountDue;
    private long daysOverdue;
    private LocalDate lastReminder;
}
