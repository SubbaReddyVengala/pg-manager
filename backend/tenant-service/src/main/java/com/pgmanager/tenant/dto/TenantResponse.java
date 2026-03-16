package com.pgmanager.tenant.dto;
import com.pgmanager.tenant.enums.IdProofType;
import com.pgmanager.tenant.enums.TenantStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class TenantResponse {

    // Table columns matching Screenshot 1
    private Long          id;
    private String        fullName;
    private String        email;
    private String        phone;
    private String        roomNumber;      // "--" if PENDING
    private LocalDate     moveInDate;
    private BigDecimal    monthlyRent;
    private BigDecimal    securityDeposit;
    private Integer       rentDueDay;
    private TenantStatus  status;
    private IdProofType   idProofType;

    // Overdue info -- powers yellow highlight in Screenshot 1
    private boolean       isOverdue;       // true if rent past due
    private long          daysOverdue;     // e.g. 5 for "5 days overdue"
}
