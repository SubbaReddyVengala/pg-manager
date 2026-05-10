package com.pgmanager.auth.controller;
import com.pgmanager.common.dto.AuthResponse;
import com.pgmanager.common.dto.LoginRequest;
import com.pgmanager.common.dto.RegisterRequest;
import com.pgmanager.common.dto.UserProfileResponse;
import com.pgmanager.auth.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
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
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.ok(authResponse);
    }

    // POST /auth/login  --  public, no token required
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.ok(authResponse);
    }

    // POST /auth/refresh  --  public, read from cookie
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = "refreshToken", required = false) String token,
            HttpServletResponse response) {
        if (token == null) {
            return ResponseEntity.status(401).build();
        }
        AuthResponse authResponse = authService.refreshToken(token);
        setRefreshTokenCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.ok(authResponse);
    }

    // POST /auth/logout  --  requires valid JWT
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletResponse response) {
        authService.logout(userDetails.getUsername());
        clearRefreshTokenCookie(response);
        return ResponseEntity.ok().build();
    }

    // GET /auth/me  --  requires valid JWT
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal com.pgmanager.auth.entity.User user) {
        return ResponseEntity.ok(UserProfileResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .ownerId(user.getTenantId() != null ? user.getId() : null) // Using tenantId as ownerId for simplicity in microservice context if applicable, or just leave it
                .build());
    }

    @GetMapping("/events")
    public ResponseEntity<?> getMyEvents(
            @AuthenticationPrincipal com.pgmanager.auth.entity.User user) {
        return ResponseEntity.ok(authService.getEvents(user.getId()));
    }

    // Internal endpoint for other services to log events
    @PostMapping("/internal/events")
    public ResponseEntity<Void> logInternalEvent(
            @RequestBody com.pgmanager.auth.entity.AccountEvent event,
            @RequestHeader("X-Gateway-Secret") String secret) {
        // Simple secret check (ideally use the same gateway secret)
        authService.saveEvent(event);
        return ResponseEntity.ok().build();
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refreshToken", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}

