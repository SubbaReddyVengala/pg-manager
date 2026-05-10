package com.pgmanager.api.payment.dto;

import com.pgmanager.common.enums.PaymentMode;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    @NotNull(message = "Tenant ID is required")
    private Long tenantId;

    @NotNull(message = "Rent month is required")
    private LocalDate rentMonth;          // e.g. 2026-03-01

    @NotNull(message = "Amount paid is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amountPaid;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode;      // CASH / UPI / BANK_TRANSFER / CHEQUE

    @Size(max = 100, message = "Transaction ID must not exceed 100 characters")
    private String transactionId;         // optional UPI ref / cheque no

    @Size(max = 255, message = "Note must not exceed 255 characters")
    private String note;                  // optional note
}




