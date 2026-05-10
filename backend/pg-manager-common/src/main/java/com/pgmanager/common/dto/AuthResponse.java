package com.pgmanager.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long   userId;
    private String email;
    private String fullName;
    private String role;
    private Long   ownerId;
    
    @JsonProperty("isFirstLogin")
    private boolean isFirstLogin;
    
    private OwnerProfileDTO profile;
}
