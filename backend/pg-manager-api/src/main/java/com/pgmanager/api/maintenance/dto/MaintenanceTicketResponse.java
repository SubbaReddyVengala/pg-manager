package com.pgmanager.api.maintenance.dto;

import com.pgmanager.api.maintenance.enums.MaintenancePriority;
import com.pgmanager.api.maintenance.enums.MaintenanceStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder
public class MaintenanceTicketResponse {
    private Long id;
    private Long roomId;
    private String roomNumber;
    private Long tenantId;
    private String tenantName;
    private String description;
    private MaintenanceStatus status;
    private MaintenancePriority priority;
    private BigDecimal cost;
    private LocalDateTime reportedAt;
    private LocalDateTime startedAt;
    private LocalDateTime resolvedAt;
}
