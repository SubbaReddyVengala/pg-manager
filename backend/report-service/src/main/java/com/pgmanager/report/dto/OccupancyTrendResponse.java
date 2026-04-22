package com.pgmanager.report.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data @Builder
public class OccupancyTrendResponse {
    private List<MonthOccupancy> trends;

    @Data @Builder
    public static class MonthOccupancy {
        private String monthLabel;
        private LocalDate month;
        private double occupancyRate;
        private long totalTenants;
    }
}
