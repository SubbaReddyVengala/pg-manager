package com.pgmanager.api.room.entity;
import com.pgmanager.common.enums.RoomStatus;
import com.pgmanager.common.enums.RoomType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import com.pgmanager.api.common.constant.TenantConstants;

import com.pgmanager.api.common.entity.TenantEntityListener;

@Entity
@Table(name = "rooms")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@EntityListeners(TenantEntityListener.class)
@FilterDef(name = TenantConstants.TENANT_FILTER_NAME, parameters = @ParamDef(name = TenantConstants.TENANT_PARAMETER_NAME, type = Long.class))
@Filter(name = TenantConstants.TENANT_FILTER_NAME, condition = TenantConstants.TENANT_COLUMN_NAME + " = :" + TenantConstants.TENANT_PARAMETER_NAME)
public class Room {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ownerId;

    @Column(nullable = false)
    private String roomNumber;

    @Column(nullable = false)
    private Integer floor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoomType roomType;

    @Column(nullable = false)
    private Integer maxCapacity;

    @Column(nullable = false)
    @Builder.Default
    private Integer occupancy = 0;   // current tenants in this room

    @Column(nullable = false)
    private BigDecimal rentAmount;

    private String amenities;        // comma-separated e.g. "AC, WiFi, Geyser"

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RoomStatus status = RoomStatus.AVAILABLE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}




