package com.pgmanager.api.auth.config;

import com.pgmanager.api.auth.repository.UserRepository;
import com.pgmanager.api.auth.util.JwtUtil;
import com.pgmanager.api.common.context.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil        jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);
            if (email != null &&
                    SecurityContextHolder.getContext().getAuthentication() == null) {
                userRepository.findByEmail(email).ifPresent(user -> {
                    if (jwtUtil.isTokenValid(token, user) && user.isEnabled()) {
                        var auth = new UsernamePasswordAuthenticationToken(
                                user, null, user.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(auth);
                        
                        // Set Tenant Context for Multi-tenancy
                        if (user.getOwnerId() != null) {
                            TenantContext.setCurrentTenant(user.getOwnerId());
                        }
                    }
                });
            }
        } catch (Exception ignored) {}

        try {
            filterChain.doFilter(request, response);
        } finally {
            // CRITICAL: Always clear context to prevent thread leakage
            TenantContext.clear();
        }
    }
}




