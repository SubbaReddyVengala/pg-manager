package com.pgmanager.room.context;

import java.util.UUID;

public class UserContext {
    private static final ThreadLocal<Long> userId = new ThreadLocal<>();
    private static final ThreadLocal<String> userEmail = new ThreadLocal<>();
    private static final ThreadLocal<UUID> tenantId = new ThreadLocal<>();

    public static void setUserId(Long id) { userId.set(id); }
    public static Long getUserId() { return userId.get(); }

    public static void setUserEmail(String email) { userEmail.set(email); }
    public static String getUserEmail() { return userEmail.get(); }

    public static void setTenantId(UUID id) { tenantId.set(id); }
    public static UUID getTenantId() { return tenantId.get(); }

    public static void clear() {
        userId.remove();
        userEmail.remove();
        tenantId.remove();
    }
}
