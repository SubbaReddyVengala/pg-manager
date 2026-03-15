package com.pgmanager.auth.controller;
import com.pgmanager.auth.dto.AuthResponse;
import com.pgmanager.auth.dto.LoginRequest;
import com.pgmanager.auth.dto.RegisterRequest;
import com.pgmanager.auth.dto.UserProfileResponse;
import com.pgmanager.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /auth/register  --  public, no token required
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // POST /auth/login  --  public, no token required
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // POST /auth/refresh  --  public, pass refreshToken as query param
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestParam String token) {
        return ResponseEntity.ok(authService.refreshToken(token));
    }

    // POST /auth/logout  --  requires valid JWT
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(userDetails.getUsername());
        return ResponseEntity.ok().build();
    }

    // GET /auth/me  --  requires valid JWT
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal com.pgmanager.auth.entity.User user) {
        return ResponseEntity.ok(new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name()
        ));
    }
}

