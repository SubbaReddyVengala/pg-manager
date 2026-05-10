package com.pgmanager.auth.service;
import com.pgmanager.common.dto.*;
import com.pgmanager.auth.entity.AccountEvent;
import com.pgmanager.auth.entity.User;
import com.pgmanager.common.enums.Role;
import com.pgmanager.auth.repository.AccountEventRepository;
import com.pgmanager.auth.repository.UserRepository;
import com.pgmanager.common.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository     userRepository;
    private final com.pgmanager.auth.repository.StaffUserRepository staffUserRepository;
    private final AccountEventRepository accountEventRepository;
    private final PasswordEncoder    passwordEncoder;
    private final JwtUtil            jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Override
    public AuthResponse loginWithEmail(String email) {
        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setLastLoginAt(java.time.LocalDateTime.now());
            userRepository.save(user);
            return buildTokenResponse(user);
        }

        var staffOpt = staffUserRepository.findByEmail(email);
        if (staffOpt.isPresent()) {
            var s = staffOpt.get();
            User staffUser = User.builder()
                    .email(s.getEmail())
                    .passwordHash("")
                    .role(Role.STAFF)
                    .active(s.isActive())
                    .fullName(s.getName())
                    .tenantId(s.getTenantId())
                    .build();
            // Since we're not saving this User object (it's a projection of StaffUser),
            // buildTokenResponse will fail if it tries to save it.
            // Let's modify buildTokenResponse to optionally not save if it's a staff member OR save to staff table.
            return buildTokenResponseForStaff(staffUser, s);
        }

        throw new RuntimeException("User not found");
    }

    private AuthResponse buildTokenResponseForStaff(User user, com.pgmanager.auth.entity.StaffUser s) {
        String refreshToken = jwtUtil.generateRefreshToken();
        s.setRefreshToken(refreshToken);
        staffUserRepository.save(s);
        return AuthResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(user))
                .refreshToken(refreshToken)
                .userId(0L)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    @Override
    public List<AccountEvent> getEvents(Long userId) {
        return accountEventRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public void saveEvent(AccountEvent event) {
        accountEventRepository.save(event);
    }

    @Override
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        User user = User.builder()
                .tenantId(java.util.UUID.randomUUID())
                .fullName(req.getFullName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(Role.OWNER)
                .active(false) // Require Admin Approval
                .build();
        
        user = userRepository.save(user);

        // Return basic response without tokens for pending account
        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        return buildTokenResponse(user);
    }

    @Override
    public AuthResponse refreshToken(String token) {
        var userOpt = userRepository.findByRefreshToken(token);
        if (userOpt.isPresent()) {
            return buildTokenResponse(userOpt.get());
        }

        var staffOpt = staffUserRepository.findByRefreshToken(token);
        if (staffOpt.isPresent()) {
            var s = staffOpt.get();
            User staffUser = User.builder()
                    .email(s.getEmail())
                    .passwordHash("")
                    .role(Role.STAFF)
                    .active(s.isActive())
                    .fullName(s.getName())
                    .tenantId(s.getTenantId())
                    .build();
            return buildTokenResponseForStaff(staffUser, s);
        }

        throw new RuntimeException("Invalid refresh token");
    }

    @Override
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setRefreshToken(null);
            userRepository.save(user);
        });
        staffUserRepository.findByEmail(email).ifPresent(staff -> {
            staff.setRefreshToken(null);
            staffUserRepository.save(staff);
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
