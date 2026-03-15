package com.pgmanager.auth.service;
import com.pgmanager.auth.dto.*;
import com.pgmanager.auth.entity.User;
import com.pgmanager.auth.enums.Role;
import com.pgmanager.auth.repository.UserRepository;
import com.pgmanager.auth.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository     userRepository;
    private final PasswordEncoder    passwordEncoder;
    private final JwtUtil            jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        User user = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(Role.OWNER)
                .build();
        return buildTokenResponse(userRepository.save(user));
    }

    @Override
    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return buildTokenResponse(user);
    }

    @Override
    public AuthResponse refreshToken(String token) {
        User user = userRepository.findByRefreshToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));
        return buildTokenResponse(user);
    }

    @Override
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setRefreshToken(null);
            userRepository.save(user);
        });
    }

    private AuthResponse buildTokenResponse(User user) {
        String refreshToken = jwtUtil.generateRefreshToken();
        user.setRefreshToken(refreshToken);
        userRepository.save(user);
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(user))
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }
}
