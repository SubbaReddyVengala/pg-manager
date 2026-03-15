package com.pgmanager.room.dto;
import com.pgmanager.room.enums.RoomStatus;
import com.pgmanager.room.enums.RoomType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RoomRequest {

    // Matches "Room Number" field in Add Room form
    @NotBlank(message = "Room number is required")
    private String roomNumber;

    // Matches "Floor" field in Add Room form
    @NotNull(message = "Floor is required")
    @Min(value = 1, message = "Floor must be at least 1")
    private Integer floor;

    // Matches "Room Type" dropdown: SINGLE, DOUBLE, TRIPLE
    @NotNull(message = "Room type is required")
    private RoomType roomType;

    // Matches "Max Capacity" field
    @NotNull(message = "Max capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer maxCapacity;

    // Matches "Monthly Rent" field
    @NotNull(message = "Rent amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Rent must be greater than 0")
    private BigDecimal rentAmount;

    // Matches "Amenities" optional field e.g. "AC, WiFi, Geyser"
    private String amenities;

    // Matches "Initial Status" dropdown: AVAILABLE, OCCUPIED, MAINTENANCE
    @NotNull(message = "Status is required")
    private RoomStatus status;
}
