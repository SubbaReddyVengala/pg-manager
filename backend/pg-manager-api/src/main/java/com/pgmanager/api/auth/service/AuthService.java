package com.pgmanager.api.auth.service;
import com.pgmanager.api.auth.dto.AuthResponse;
import com.pgmanager.api.auth.dto.LoginRequest;
import com.pgmanager.api.auth.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String token);
    void logout(String email);
}
