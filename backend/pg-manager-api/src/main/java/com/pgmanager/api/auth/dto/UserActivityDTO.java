package com.pgmanager.api.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserActivityDTO {
    private String actionType;
    private String description;
    private LocalDateTime timestamp;
}




