package com.pgmanager.api.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OccupancyTrendResponse {
    private List<MonthOccupancy> trends;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthOccupancy {
        private String monthLabel;
        private LocalDate month;
        private double occupancyRate;
        private long totalTenants;
    }
}




