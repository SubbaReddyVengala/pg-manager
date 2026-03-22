package com.pgmanager.payment.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data @Builder
public class MonthlyReportResponse {
    private LocalDate     month;
    private BigDecimal    totalCollected;
    private BigDecimal    totalOutstanding;
    private BigDecimal    totalRentDue;       // sum of all rent amounts
    private long          totalTenants;
    private long          paidCount;
    private long          overdueCount;
    private long          partialCount;
    private long          pendingCount;
    private double        collectionRate;     // totalCollected / totalRentDue * 100
    private List<PaymentResponse> payments;   // tenant-wise breakdown
}

