package com.pgmanager.payment.entity;

import com.pgmanager.payment.enums.PaymentMode;
import com.pgmanager.payment.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "rent_payments", schema = "payment_schema")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RentPayment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private String tenantName;

    @Column(nullable = false)
    private Long roomId;

    @Column(nullable = false)
    private String roomNumber;

    @Column(nullable = false)
    private LocalDate rentMonth;       // always 1st of month

    @Column(nullable = false)
    private BigDecimal rentAmount;     // monthly rent from tenant

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;  // rentAmount - amountPaid

    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    private PaymentMode paymentMode;

    private String transactionId;
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    private String receiptNumber;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
