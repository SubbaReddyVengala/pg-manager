package com.pgmanager.api.auth.service;

import com.pgmanager.api.auth.dto.*;
import com.pgmanager.common.dto.*;
import java.util.List;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String token);
    void logout(String email);
    
    // Staff Management
    UserProfileResponse createStaff(RegisterRequest request);
    List<UserProfileResponse> getStaffMembers();
    void deleteStaff(Long id);

    // Admin Management
    void changePassword(ChangePasswordRequest request);

    // Password Reset
    void initiatePasswordReset(String email);
    void completePasswordReset(String token, String newPassword);
}





