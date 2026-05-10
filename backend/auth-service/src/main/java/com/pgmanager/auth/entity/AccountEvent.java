package com.pgmanager.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "account_events", schema = "auth_schema")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AccountEvent {
    @Id
    private UUID id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String eventType;

    private String description;
    private String performedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = LocalDateTime.now();
    }
}
