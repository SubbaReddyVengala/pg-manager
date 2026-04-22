package com.pgmanager.api.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "pg_settings", schema = "auth_schema")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PgSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- PG Profile ---
    private String pgName;
    private String ownerName;
    private String phone;
    private String address;

    // --- Notification Settings ---
    @Builder.Default
    private boolean whatsappReminders = true;
    @Builder.Default
    private boolean emailNotifications = true;
    @Builder.Default
    private boolean overdueAlerts = true;
    @Builder.Default
    private boolean maintenanceAlerts = false;
    @Builder.Default
    private boolean monthlyReportEmail = false;

    // --- Payment Settings ---
    @Builder.Default
    private int defaultRentDueDay = 1;
    @Builder.Default
    private int lateFeeAfterDays = 5;
    @Builder.Default
    private double lateFeeAmount = 50.0;
}
