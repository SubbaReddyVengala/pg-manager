package com.pgmanager.api.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProfitTrendResponse {
    private List<MonthProfit> trends;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthProfit {
        private String monthLabel;
        private LocalDate month;
        private BigDecimal revenue;
        private BigDecimal expenses;
        private BigDecimal profit;
    }
}




