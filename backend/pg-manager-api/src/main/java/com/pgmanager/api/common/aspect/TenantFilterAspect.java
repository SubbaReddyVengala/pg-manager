package com.pgmanager.api.common.aspect;

import com.pgmanager.api.common.constant.TenantConstants;
import com.pgmanager.api.common.context.TenantContext;
import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.pgmanager.api.auth.entity.User;
import com.pgmanager.common.enums.Role;
import org.springframework.security.core.context.SecurityContextHolder;

@Aspect
@Component
public class TenantFilterAspect {

    @Autowired
    private EntityManager entityManager;

    @Before("execution(* com.pgmanager.api.*.service.*.*(..))")
    public void beforeServiceMethod() {
        // Skip filtering if SUPER_ADMIN
        if (isSuperAdmin()) {
            return;
        }

        Long tenantId = TenantContext.getCurrentTenant();
        if (tenantId != null) {
            Session session = entityManager.unwrap(Session.class);
            session.enableFilter(TenantConstants.TENANT_FILTER_NAME)
                    .setParameter(TenantConstants.TENANT_PARAMETER_NAME, tenantId);
        }
    }

    private boolean isSuperAdmin() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return user.getRole() == Role.SUPER_ADMIN;
        }
        return false;
    }
}




