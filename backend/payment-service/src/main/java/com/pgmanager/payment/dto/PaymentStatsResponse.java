package com.pgmanager.payment.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data @Builder
public class PaymentStatsResponse {
    private BigDecimal collected;          // Screenshot 1: COLLECTED card
    private long       collectedCount;     // '1 Fully Paid'
    private BigDecimal outstanding;        // Screenshot 1: OUTSTANDING card
    private long       overdueCount;       // '1 Overdue'
    private BigDecimal dueThisWeek;        // Screenshot 1: DUE THIS WEEK card
    private long       dueThisWeekCount;   // '1 on Due'
    private BigDecimal depositsHeld;       // Screenshot 1: DEPOSITS HELD card
    private long       depositsCount;      // '6 Tenants'
}
