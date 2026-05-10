package com.pgmanager.api.auth.controller;
import com.pgmanager.common.dto.AuthResponse;
import com.pgmanager.common.dto.LoginRequest;
import com.pgmanager.common.dto.RegisterRequest;
import com.pgmanager.common.dto.UserProfileResponse;
import com.pgmanager.api.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestParam String token) {
        return ResponseEntity.ok(authService.refreshToken(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal com.pgmanager.api.auth.entity.User user) {
        return ResponseEntity.ok(new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                user.getOwnerId(),
                user.isFirstLogin(),
                user.getTempPassword()
        ));
    }

    @PostMapping("/staff")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<UserProfileResponse> createStaff(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.createStaff(request));
    }

    @GetMapping("/staff")
    public ResponseEntity<List<UserProfileResponse>> getStaff() {
        return ResponseEntity.ok(authService.getStaffMembers());
    }

    @DeleteMapping("/staff/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        authService.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody com.pgmanager.common.dto.ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@RequestParam String email) {
        authService.initiatePasswordReset(email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody com.pgmanager.common.dto.PasswordResetRequest request) {
        authService.completePasswordReset(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }
}




