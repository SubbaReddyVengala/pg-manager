package com.pgmanager.api.common.audit;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "owner_id")
    private Long ownerId;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "action_type")
    private String actionType;
    
    @Column(name = "entity_name")
    private String entityName;
    
    @Column(name = "entity_id")
    private Long entityId;
    
    private String details;
    
    @Column(name = "ip_address")
    private String ipAddress;
    
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }
}




