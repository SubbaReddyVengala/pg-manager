package com.pgmanager.tenant.config;

import com.pgmanager.tenant.context.UserContext;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class GatewayHeaderFilter implements Filter {

    @Value("${gateway.internal-secret:pg-internal-trust-secret-2026}")
    private String internalSecret;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String gatewaySecret = httpRequest.getHeader("X-Gateway-Secret");
        
        if (gatewaySecret == null || !gatewaySecret.equals(internalSecret)) {
            httpResponse.sendError(HttpServletResponse.SC_FORBIDDEN, "Direct access is not allowed");
            return;
        }

        String userIdStr = httpRequest.getHeader("X-User-Id");
        String userEmail = httpRequest.getHeader("X-User-Email");
        String userRole = httpRequest.getHeader("X-User-Role");
        String tenantIdStr = httpRequest.getHeader("X-User-Tenant-Id");

        if (tenantIdStr != null && !tenantIdStr.equals("null")) {
            try {
                UserContext.setTenantId(UUID.fromString(tenantIdStr));
            } catch (Exception ignored) {}
        }

        if (userIdStr != null) {
            try {
                Long userId = Long.parseLong(userIdStr);
                UserContext.setUserId(userId);

                List<GrantedAuthority> authorities = new ArrayList<>();
                if (userRole != null) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + userRole));
                }

                // Set Spring Security context for .authenticated() and role checks
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        userId, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (NumberFormatException ignored) {}
        }
        if (userEmail != null) {
            UserContext.setUserEmail(userEmail);
        }

        try {
            chain.doFilter(request, response);
        } finally {
            UserContext.clear();
            SecurityContextHolder.clearContext();
        }
    }
}
