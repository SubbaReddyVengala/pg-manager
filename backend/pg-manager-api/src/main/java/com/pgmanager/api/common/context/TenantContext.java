package com.pgmanager.api.common.context;

public class TenantContext {
    private static final ThreadLocal<Long> CURRENT_TENANT = new ThreadLocal<>();

    public static Long getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void setCurrentTenant(Long tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}




