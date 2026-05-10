package com.pgmanager.api.auth.service;

import com.pgmanager.api.auth.dto.*;
import com.pgmanager.common.dto.AuthResponse;
import com.pgmanager.common.dto.LoginRequest;
import com.pgmanager.common.dto.RegisterRequest;
import com.pgmanager.api.auth.entity.User;
import com.pgmanager.common.enums.Role;
import com.pgmanager.api.auth.repository.OwnerProfileRepository;
import com.pgmanager.api.auth.repository.UserRepository;
import com.pgmanager.api.auth.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private OwnerProfileRepository ownerProfileRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = RegisterRequest.builder()
                .fullName("Test Owner")
                .email("test@example.com")
                .phone("9347917653")
                .password("Password@123")
                .build();
    }

    @Test
    void register_Success() {
        // Given
        when(userRepository.existsByEmail(validRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashed_password");
        
        User savedUser = User.builder()
                .id(1L)
                .email(validRequest.getEmail())
                .fullName(validRequest.getFullName())
                .role(Role.OWNER)
                .build();
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateAccessToken(any())).thenReturn("access_token");
        when(jwtUtil.generateRefreshToken()).thenReturn("refresh_token");

        // When
        AuthResponse response = authService.register(validRequest);

        // Then
        assertNotNull(response);
        assertEquals(validRequest.getEmail(), response.getEmail());
        assertEquals("access_token", response.getAccessToken());
        verify(userRepository, times(3)).save(any());
    }

    @Test
    void register_EmailAlreadyExists_ThrowsException() {
        // Given
        when(userRepository.existsByEmail(validRequest.getEmail())).thenReturn(true);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.register(validRequest);
        });
        assertEquals("Email already registered", exception.getMessage());
    }

    @Test
    void login_Success() {
        // Given
        LoginRequest loginRequest = new LoginRequest("test@example.com", "Password@123");
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test Owner")
                .role(Role.OWNER)
                .build();

        when(userRepository.findByEmail(any())).thenReturn(Optional.of(user));
        when(jwtUtil.generateAccessToken(any())).thenReturn("access_token");
        when(jwtUtil.generateRefreshToken()).thenReturn("refresh_token");

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertNotNull(response);
        assertEquals("access_token", response.getAccessToken());
        verify(authenticationManager).authenticate(any());
    }
}
