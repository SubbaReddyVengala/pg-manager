package com.pgmanager.api.auth.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LimitRequestDTO {
    private Long id;
    private Long ownerId;
    private String ownerName; // Helpful for Admin view
    private String requestType; // ROOMS, TENANTS
    private int currentLimit;
    private int requestedLimit;
    private String status;
    private String adminNote;
    private LocalDateTime createdAt;
}




