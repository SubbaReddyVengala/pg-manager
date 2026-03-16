package com.pgmanager.tenant.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssignRoomRequest {

    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotNull(message = "Move-in date is required")
    private LocalDate moveInDate;

    @NotNull(message = "Monthly rent is required")
    private BigDecimal monthlyRent;

    @NotNull(message = "Security deposit is required")
    private BigDecimal securityDeposit;

    @NotNull(message = "Rent due day is required")
    @Min(value=1) @Max(value=31)
    private Integer rentDueDay;
}
