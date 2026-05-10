package com.pgmanager.api.maintenance.dto;

import com.pgmanager.common.enums.MaintenancePriority;
import com.pgmanager.common.enums.MaintenanceStatus;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class MaintenanceTicketRequest {
    private Long roomId;
    private String roomNumber;
    private Long tenantId;
    private String tenantName;
    @NotBlank(message = "Description is required")
    @Size(min = 5, max = 1000, message = "Description must be between 5 and 1000 characters")
    private String description;
    private MaintenancePriority priority;

    @DecimalMin(value = "0.0", message = "Cost must be positive")
    @Digits(integer = 10, fraction = 2, message = "Cost must have at most 2 decimal places")
    private BigDecimal cost;
}




