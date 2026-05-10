package com.pgmanager.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OwnerProfileDTO {
    private Long userId;
    private String email;
    private String phone;
    private String fullName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
    
    private long roomCount;
    private long tenantCount;
    private LocalDateTime trialEndDate;

    private int maxRooms;
    private int maxTenants;
    private boolean dashboardEnabled;
    private boolean paymentsEnabled;
    private boolean reportsEnabled;
    private boolean whatsappEnabled;
    private boolean maintenanceEnabled;
    private boolean expensesEnabled;
    private boolean bulkOpsEnabled;
    private boolean pdfReceiptsEnabled;
    private int healthScore;
    private String tempPassword;
}
