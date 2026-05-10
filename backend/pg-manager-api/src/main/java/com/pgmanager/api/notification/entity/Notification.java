package com.pgmanager.api.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import org.hibernate.annotations.Filter;
import com.pgmanager.api.common.constant.TenantConstants;

@Entity
@Table(name = "notifications")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Filter(name = TenantConstants.TENANT_FILTER_NAME, condition = TenantConstants.TENANT_COLUMN_NAME + " = :" + TenantConstants.TENANT_PARAMETER_NAME)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ownerId;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    private String type;
    
    private String recipient;
    
    private Long tenantId;
    
    @Column(name = "is_read")
    private boolean isRead;
    
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }
}




