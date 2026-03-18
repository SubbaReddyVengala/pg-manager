package com.pgmanager.tenant.dto;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class AssignRoomRequest {
    private Long roomId;
    private LocalDate moveInDate;
    private BigDecimal monthlyRent;
    private BigDecimal securityDeposit;
    private Integer rentDueDay;
}