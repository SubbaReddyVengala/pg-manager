package com.pgmanager.api.payment.entity;

import com.pgmanager.common.enums.PaymentMode;
import com.pgmanager.common.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.Filter;
import com.pgmanager.api.common.constant.TenantConstants;

import com.pgmanager.api.common.entity.TenantEntityListener;

@Entity
@Table(name = "rent_payments")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@EntityListeners(TenantEntityListener.class)
@Filter(name = TenantConstants.TENANT_FILTER_NAME, condition = TenantConstants.TENANT_COLUMN_NAME + " = :" + TenantConstants.TENANT_PARAMETER_NAME)
public class RentPayment {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ownerId;

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




