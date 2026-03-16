package com.pgmanager.tenant.dto;
import com.pgmanager.tenant.enums.IdProofType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TenantRequest {

    // PERSONAL DETAILS (all required)
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone is required")
    private String phone;

    @Email(message = "Valid email is required")
    @NotBlank(message = "Email is required")
    private String email;

    // ROOM & RENT (optional on create - null = PENDING tenant)
    private Long      roomId;          // null = PENDING
    private LocalDate moveInDate;
    private BigDecimal monthlyRent;
    private BigDecimal securityDeposit;
    private Integer   rentDueDay;      // 1 to 31

    // ID & EMERGENCY (optional)
    private IdProofType idProofType;
    private String idNumber;
    private String emergencyContact;
    private String emergencyPhone;
    private String permanentAddress;
}
