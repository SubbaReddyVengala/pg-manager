package com.pgmanager.api.common.entity;

import com.pgmanager.api.common.context.TenantContext;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.lang.reflect.Field;

public class TenantEntityListener {

    @PrePersist
    @PreUpdate
    public void setTenant(Object entity) {
        Long tenantId = TenantContext.getCurrentTenant();
        if (tenantId != null) {
            try {
                Field field = findField(entity.getClass(), "ownerId");
                if (field != null) {
                    field.setAccessible(true);
                    field.set(entity, tenantId);
                }
            } catch (Exception e) {
                // If the entity doesn't have ownerId, skip
            }
        }
    }

    private Field findField(Class<?> clazz, String fieldName) {
        Class<?> current = clazz;
        while (current != null) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        return null;
    }
}




