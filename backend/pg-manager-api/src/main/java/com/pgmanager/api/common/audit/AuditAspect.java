package com.pgmanager.api.common.audit;

import com.pgmanager.api.common.context.TenantContext;
import com.pgmanager.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;

    @AfterReturning(pointcut = "execution(* com.pgmanager.api.*.service.*.create*(..)) || " +
                               "execution(* com.pgmanager.api.*.service.*.update*(..)) || " +
                               "execution(* com.pgmanager.api.*.service.*.delete*(..))",
                    returning = "result")
    public void logActivity(JoinPoint joinPoint, Object result) {
        try {
            Long ownerId = TenantContext.getCurrentTenant();
            Long userId = SecurityUtils.getCurrentUserId();
            
            if (ownerId == null) return;

            String methodName = joinPoint.getSignature().getName();
            String actionType = methodName.startsWith("create") ? "CREATE" :
                               methodName.startsWith("update") ? "UPDATE" : "DELETE";

            AuditLog log = AuditLog.builder()
                    .ownerId(ownerId)
                    .userId(userId)
                    .actionType(actionType)
                    .entityName(joinPoint.getSignature().getDeclaringType().getSimpleName().replace("ServiceImpl", ""))
                    .details("Executed: " + methodName)
                    .build();

            auditLogRepository.save(log);
        } catch (Exception ignored) {
            // Never let audit logging fail the primary business transaction
        }
    }
}




