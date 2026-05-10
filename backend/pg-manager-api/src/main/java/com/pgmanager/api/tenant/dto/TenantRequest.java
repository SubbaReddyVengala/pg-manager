package com.pgmanager.api.tenant.dto;
import com.pgmanager.common.enums.IdProofType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TenantRequest {

    // PERSONAL DETAILS (all required)
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @Pattern(regexp = "^[a-zA-Z\\s]*$", message = "Full name must contain only letters and spaces")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    @Email(message = "Please provide a valid email address")
    @NotBlank(message = "Email is required")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    // ROOM & RENT (optional on create - null = PENDING tenant)
    private Long      roomId;          // null = PENDING
    private LocalDate moveInDate;
    
    @DecimalMin(value = "0.0", message = "Monthly rent must be positive")
    @Digits(integer = 10, fraction = 2, message = "Rent must have at most 2 decimal places")
    private BigDecimal monthlyRent;
    
    @DecimalMin(value = "0.0", message = "Security deposit must be positive")
    @Digits(integer = 10, fraction = 2, message = "Security deposit must have at most 2 decimal places")
    private BigDecimal securityDeposit;
    
    @Min(value = 1, message = "Rent due day must be at least 1")
    @Max(value = 31, message = "Rent due day cannot exceed 31")
    private Integer   rentDueDay;      // 1 to 31

    // ID & EMERGENCY (optional)
    private IdProofType idProofType;
    
    @Size(max = 50, message = "ID number must not exceed 50 characters")
    private String idNumber;
    
    @Size(max = 100, message = "Emergency contact name must not exceed 100 characters")
    private String emergencyContact;
    
    @Pattern(regexp = "^$|[0-9]{10}$", message = "Emergency phone must be exactly 10 digits")
    private String emergencyPhone;
    
    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String permanentAddress;

    // UI FLAGS
    private boolean recordInitialPayment = true; // default to true
}




