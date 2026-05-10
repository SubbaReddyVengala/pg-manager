package com.pgmanager.auth.service;
import com.pgmanager.common.dto.AuthResponse;
import com.pgmanager.common.dto.LoginRequest;
import com.pgmanager.common.dto.RegisterRequest;
import com.pgmanager.auth.entity.AccountEvent;
import java.util.List;

public interface AuthService {
    AuthResponse register(RegisterRequest req);
    AuthResponse login(LoginRequest req);
    AuthResponse refreshToken(String token);
    void logout(String email);
    List<AccountEvent> getEvents(Long userId);
    void saveEvent(AccountEvent event);
    AuthResponse loginWithEmail(String email);
}

