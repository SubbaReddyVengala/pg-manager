package com.pgmanager.auth.config;
import com.pgmanager.auth.repository.UserRepository;
import com.pgmanager.auth.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil        jwtUtil;
    private final UserRepository userRepository;

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
                    if (jwtUtil.isTokenValid(token, user)) {
                        var auth = new UsernamePasswordAuthenticationToken(
                                user, null, user.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                });
            }
        } catch (Exception ignored) {}

        filterChain.doFilter(request, response);
    }
}

