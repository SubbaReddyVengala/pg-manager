package com.pgmanager.api.maintenance.entity;

import com.pgmanager.api.maintenance.enums.MaintenancePriority;
import com.pgmanager.api.maintenance.enums.MaintenanceStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_tickets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MaintenanceTicket {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
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
