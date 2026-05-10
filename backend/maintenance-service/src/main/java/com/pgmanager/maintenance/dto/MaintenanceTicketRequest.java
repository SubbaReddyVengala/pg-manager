package com.pgmanager.maintenance.dto;

import com.pgmanager.common.enums.MaintenancePriority;
import com.pgmanager.common.enums.MaintenanceStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class MaintenanceTicketRequest {
    private Long roomId;
    private String roomNumber;
    private Long tenantId;
    private String tenantName;
    @NotBlank(message = "Description is required")
    private String description;
    private MaintenancePriority priority;
    private BigDecimal cost;
}
