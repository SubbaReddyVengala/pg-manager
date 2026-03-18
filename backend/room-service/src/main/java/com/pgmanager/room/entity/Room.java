package com.pgmanager.room.entity;
import com.pgmanager.room.enums.RoomStatus;
import com.pgmanager.room.enums.RoomType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rooms", schema = "room_schema")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Room {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
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
