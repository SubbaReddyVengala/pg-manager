package com.pgmanager.common.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    @NotBlank(message = "Password is required")
    private String password;

    // Feature Flags (for Provisioning)
    private int maxRooms;
    private int maxTenants;
    
    @Builder.Default
    private boolean dashboardEnabled = true;
    @Builder.Default
    private boolean paymentsEnabled = false;
    @Builder.Default
    private boolean reportsEnabled = false;
    @Builder.Default
    private boolean whatsappEnabled = false;
    @Builder.Default
    private boolean maintenanceEnabled = true;
}
