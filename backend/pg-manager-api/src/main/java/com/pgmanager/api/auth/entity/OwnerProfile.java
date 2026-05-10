package com.pgmanager.api.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "owner_profiles")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OwnerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    private LocalDateTime trialEndDate;

    @Builder.Default
    private int maxRooms = 50;

    @Builder.Default
    private int maxTenants = 200;

    // Feature Permissions
    @Builder.Default
    private boolean dashboardEnabled = true;

    @Builder.Default
    private boolean paymentsEnabled = true;

    @Builder.Default
    private boolean reportsEnabled = true;

    @Builder.Default
    private boolean whatsappEnabled = true;

    @Builder.Default
    private boolean maintenanceEnabled = true;

    @Builder.Default
    private boolean expensesEnabled = true;

    @Builder.Default
    private boolean bulkOpsEnabled = false;

    @Builder.Default
    private boolean pdfReceiptsEnabled = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}




