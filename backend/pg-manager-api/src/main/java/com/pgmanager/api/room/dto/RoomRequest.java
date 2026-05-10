package com.pgmanager.api.room.dto;
import com.pgmanager.common.enums.RoomStatus;
import com.pgmanager.common.enums.RoomType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class RoomRequest {

    // Matches "Room Number" field in Add Room form
    @NotBlank(message = "Room number is required")
    @Size(min = 1, max = 20, message = "Room number must be between 1 and 20 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\-\\s]*$", message = "Room number can only contain letters, numbers, hyphens, and spaces")
    private String roomNumber;

    // Matches "Floor" field in Add Room form
    @NotNull(message = "Floor is required")
    @Min(value = 1, message = "Floor must be at least 1")
    @Max(value = 100, message = "Floor cannot exceed 100")
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
    @Digits(integer = 10, fraction = 2, message = "Rent must have at most 2 decimal places")
    private BigDecimal rentAmount;

    // Matches "Amenities" optional field e.g. "AC, WiFi, Geyser"
    @Size(max = 500, message = "Amenities description must not exceed 500 characters")
    private String amenities;

    // Matches "Initial Status" dropdown: AVAILABLE, OCCUPIED, MAINTENANCE
    @NotNull(message = "Status is required")
    private RoomStatus status;
}




