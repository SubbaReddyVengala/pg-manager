package com.pgmanager.auth.service;
import com.pgmanager.auth.dto.AuthResponse;
import com.pgmanager.auth.dto.LoginRequest;
import com.pgmanager.auth.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String token);
    void logout(String email);
}
