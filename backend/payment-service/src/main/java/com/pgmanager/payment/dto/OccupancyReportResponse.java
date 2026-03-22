package com.pgmanager.payment.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder
public class OccupancyReportResponse {
    private long totalRooms;
    private long occupiedRooms;
    private long availableRooms;
    private double occupancyRate;
    private BigDecimal totalRentPotential;  // if all rooms full
    private BigDecimal actualRentCollected;
    private List<RoomStat> roomStats;

    @Data
    @Builder
    public static class RoomStat {
        private String roomNumber;
        private String roomType;
        private int capacity;
        private int occupancy;
        private String status;
        private BigDecimal rentAmount;
    }
}