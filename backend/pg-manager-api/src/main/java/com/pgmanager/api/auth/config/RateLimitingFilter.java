package com.pgmanager.api.auth.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 60;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String ip = request.getRemoteAddr();
        String path = request.getRequestURI();

        // Only rate limit Auth endpoints to prevent brute force
        if (path.startsWith("/api/v1/auth/login")) {
            RequestCounter counter = requestCounts.computeIfAbsent(ip, k -> new RequestCounter());
            if (counter.incrementAndCheckLimit()) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many login attempts. Please try again in a minute.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private static class RequestCounter {
        private final AtomicInteger count = new AtomicInteger(0);
        private long timestamp = System.currentTimeMillis();

        public synchronized boolean incrementAndCheckLimit() {
            long now = System.currentTimeMillis();
            if (now - timestamp > 60000) {
                count.set(0);
                timestamp = now;
            }
            return count.incrementAndGet() > MAX_REQUESTS_PER_MINUTE;
        }
    }
}




