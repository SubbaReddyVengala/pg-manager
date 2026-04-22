package com.pgmanager.report.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data @Builder
public class ProfitTrendResponse {
    private List<MonthProfit> trends;

    @Data @Builder
    public static class MonthProfit {
        private String monthLabel;
        private LocalDate month;
        private BigDecimal revenue;
        private BigDecimal expenses;
        private BigDecimal profit;
    }
}
