package com.pgmanager.api.maintenance.entity;

import com.pgmanager.common.enums.MaintenancePriority;
import com.pgmanager.common.enums.MaintenanceStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.Filter;
import com.pgmanager.api.common.constant.TenantConstants;

import com.pgmanager.api.common.entity.TenantEntityListener;

@Entity
@Table(name = "maintenance_tickets")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(TenantEntityListener.class)
@Filter(name = TenantConstants.TENANT_FILTER_NAME, condition = TenantConstants.TENANT_COLUMN_NAME + " = :" + TenantConstants.TENANT_PARAMETER_NAME)
public class MaintenanceTicket {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long ownerId;
    private Long roomId;
    private String roomNumber;
    private Long tenantId;
    private String tenantName;
    @Column(nullable = false)
    private String description;
    @Enumerated(EnumType.STRING)
    private MaintenanceStatus status;
    @Enumerated(EnumType.STRING)
    private MaintenancePriority priority;
    private BigDecimal cost;
    private LocalDateTime reportedAt;
    private LocalDateTime startedAt;
    private LocalDateTime resolvedAt;

    @PrePersist
    public void prePersist() {
        if (reportedAt == null) reportedAt = LocalDateTime.now();
        if (status == null) status = MaintenanceStatus.OPEN;
        if (priority == null) priority = MaintenancePriority.MEDIUM;
        if (cost == null) cost = BigDecimal.ZERO;
    }
}




