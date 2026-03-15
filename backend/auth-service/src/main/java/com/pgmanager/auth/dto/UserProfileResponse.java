package com.pgmanager.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserProfileResponse {
    private Long   userId;
    private String email;
    private String fullName;
    private String role;
}