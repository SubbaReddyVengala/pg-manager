package com.pgmanager.payment.dto;

import com.pgmanager.payment.enums.PaymentMode;
import com.pgmanager.payment.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @Builder
public class PaymentResponse {
    private Long          id;
    private Long          tenantId;
    private String        tenantName;      // Screenshot 1: TENANT column
    private Long          roomId;
    private String        roomNumber;      // Screenshot 1: ROOM column
    private LocalDate     rentMonth;
    private BigDecimal    rentAmount;      // Screenshot 1: RENT AMOUNT column
    private BigDecimal    amountPaid;
    private BigDecimal    balance;         // remaining for PARTIAL
    private LocalDate     paymentDate;     // Screenshot 1: PAID DATE column
    private LocalDate     dueDate;         // Screenshot 1: DUE DATE column (rentDueDay of month)
    private PaymentMode   paymentMode;     // Screenshot 1: MODE column
    private String        transactionId;   // Screenshot 1: TXN ID column
    private String        note;
    private PaymentStatus status;          // Screenshot 1: STATUS column
    private String        receiptNumber;
    private boolean       isOverdue;       // red highlight in Screenshot 1
}
