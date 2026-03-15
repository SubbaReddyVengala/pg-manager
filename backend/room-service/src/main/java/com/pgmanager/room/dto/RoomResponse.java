package com.pgmanager.room.dto;
import com.pgmanager.room.enums.RoomStatus;
import com.pgmanager.room.enums.RoomType;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class RoomResponse {
    private Long          id;
    private String        roomNumber;
    private Integer       floor;
    private RoomType      roomType;
    private Integer       maxCapacity;
    private Integer       occupancy;        // current tenant count
    private BigDecimal    rentAmount;
    private String        amenities;
    private RoomStatus    status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
