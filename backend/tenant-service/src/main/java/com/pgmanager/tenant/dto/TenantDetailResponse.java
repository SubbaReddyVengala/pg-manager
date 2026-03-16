package com.pgmanager.tenant.dto;
import com.pgmanager.tenant.enums.IdProofType;
import com.pgmanager.tenant.enums.TenantStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class TenantDetailResponse {

    // All personal fields (left column in Screenshot 3)
    private Long          id;
    private String        fullName;
    private String        phone;
    private String        email;
    private Long          roomId;
    private String        roomNumber;
    private Integer       roomFloor;
    private LocalDate     moveInDate;
    private LocalDate     moveOutDate;
    private BigDecimal    monthlyRent;
    private BigDecimal    securityDeposit;
    private Integer       rentDueDay;
    private IdProofType   idProofType;
    private String        idNumber;
    private String        emergencyContact;
    private String        emergencyPhone;
    private String        permanentAddress;
    private TenantStatus  status;

    // Payment Summary (right panel in Screenshot 3)
    private BigDecimal    totalPaid;        // from payment-service (Phase 4)
    private BigDecimal    outstanding;      // rent due but unpaid
    private long          stayDurationMonths; // "2 months"
    private boolean       isGoodStanding;   // true if outstanding == 0
}
