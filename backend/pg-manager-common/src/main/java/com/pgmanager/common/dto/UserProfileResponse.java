package com.pgmanager.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserProfileResponse {
    private Long   userId;
    private String email;
    private String fullName;
    private String role;
    private Long   ownerId;
    
    @JsonProperty("isFirstLogin")
    private boolean isFirstLogin;
    
    private String tempPassword;
}
