package com.pgmanager.common.util;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    public static Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        // This needs to handle both monolith (User entity) and microservices (Long ID from token)
        if (principal instanceof Long) {
            return (Long) principal;
        }
        // In monolith, Principal might be the User entity itself
        try {
            java.lang.reflect.Method getId = principal.getClass().getMethod("getId");
            return (Long) getId.invoke(principal);
        } catch (Exception e) {
            throw new RuntimeException("Could not determine current user ID from principal: " + principal.getClass().getName());
        }
    }

    public static Long getCurrentOwnerId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        try {
            java.lang.reflect.Method getOwnerId = principal.getClass().getMethod("getOwnerId");
            Long ownerId = (Long) getOwnerId.invoke(principal);
            return ownerId != null ? ownerId : getCurrentUserId();
        } catch (Exception e) {
            // Fallback for microservices where principal might just be a Long (userId)
            // In microservices mode, the Gateway adds headers, and filter sets them in context.
            // We might need a more unified way to store this in SecurityContext.
            return getCurrentUserId();
        }
    }
}
