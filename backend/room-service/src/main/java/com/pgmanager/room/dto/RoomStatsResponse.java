
package com.pgmanager.room.dto;
import lombok.*;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class RoomStatsResponse {
    private long   totalRooms;
    private long   occupied;
    private long   available;
    private long   maintenance;
    private double occupancyRate;   // percentage e.g. 66.7
}
