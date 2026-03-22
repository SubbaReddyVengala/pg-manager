
package com.pgmanager.payment.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;
@Data @Builder
public class AnnualSummaryResponse {
    private int                   year;
    private BigDecimal            totalCollected;   // full year
    private BigDecimal            totalOutstanding; // full year
    private List<MonthSummary>    months;           // 12 months data for bar chart

    @Data @Builder
    public static class MonthSummary {
        private String     monthLabel;   // 'Jan', 'Feb' etc.
        private LocalDate  month;
        private BigDecimal collected;
        private BigDecimal outstanding;
        private long       tenantCount;
    }
}
