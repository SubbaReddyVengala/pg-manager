package com.pgmanager.tenant.entity;
import com.pgmanager.tenant.enums.IdProofType;
import com.pgmanager.tenant.enums.TenantStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenants", schema = "tenant_schema")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Tenant {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Personal Details ────────────────────────
    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false, unique = true)
    private String email;

    // ── Room & Rent (nullable - PENDING has no room) ──
    private Long   roomId;          // FK to room_schema.rooms.id
    private String roomNumber;      // denormalized for display
    private LocalDate moveInDate;
    private LocalDate moveOutDate;  // set during move-out
    private BigDecimal monthlyRent;
    private BigDecimal securityDeposit;
    private Integer rentDueDay;     // 1-31

    // ── ID & Emergency ──────────────────────────
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IdProofType idProofType = IdProofType.AADHAAR;

    private String idNumber;
    private String emergencyContact;
    private String emergencyPhone;
    private String permanentAddress;

    // ── Status ──────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TenantStatus status = TenantStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}

