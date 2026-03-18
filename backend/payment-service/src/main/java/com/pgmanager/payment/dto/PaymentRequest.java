package com.pgmanager.payment.dto;

import com.pgmanager.payment.enums.PaymentMode;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
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

    private String transactionId;         // optional UPI ref / cheque no
    private String note;                  // optional note
}
