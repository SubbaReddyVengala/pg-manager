package com.pgmanager.api.common.aspect;

import com.pgmanager.api.auth.entity.UserActivity;
import com.pgmanager.api.auth.repository.UserActivityRepository;
import com.pgmanager.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class UserActivityAspect {

    private final UserActivityRepository userActivityRepository;

    @Pointcut("execution(* com.pgmanager.api.room.service.RoomService.createRoom(..))")
    public void roomCreation() {}

    @Pointcut("execution(* com.pgmanager.api.tenant.service.TenantService.addTenant(..))")
    public void tenantAddition() {}

    @Pointcut("execution(* com.pgmanager.api.payment.service.PaymentService.recordPayment(..))")
    public void paymentRecording() {}

    @Pointcut("execution(* com.pgmanager.api.maintenance.service.MaintenanceService.createTicket(..))")
    public void maintenanceTicketCreation() {}

    @AfterReturning("roomCreation()")
    public void logRoomCreation(JoinPoint joinPoint) {
        logActivity("ROOM_ADDED", "New room added to the system");
    }

    @AfterReturning("tenantAddition()")
    public void logTenantAddition(JoinPoint joinPoint) {
        logActivity("TENANT_ADDED", "New tenant onboarded");
    }

    @AfterReturning("paymentRecording()")
    public void logPaymentRecording(JoinPoint joinPoint) {
        logActivity("PAYMENT_RECORDED", "Rent payment recorded");
    }

    @AfterReturning("maintenanceTicketCreation()")
    public void logMaintenanceTicketCreation(JoinPoint joinPoint) {
        logActivity("MAINTENANCE_TICKET", "New maintenance ticket raised");
    }

    private void logActivity(String actionType, String description) {
        try {
            Long userId = SecurityUtils.getCurrentUserId();
            Long ownerId = SecurityUtils.getCurrentOwnerId();
            
            UserActivity activity = UserActivity.builder()
                    .userId(userId)
                    .ownerId(ownerId)
                    .actionType(actionType)
                    .description(description)
                    .timestamp(LocalDateTime.now())
                    .build();
            
            userActivityRepository.save(activity);
            log.debug("Logged user activity: {} for user: {}", actionType, userId);
        } catch (Exception e) {
            log.warn("Could not log user activity {}: {}", actionType, e.getMessage());
        }
    }
}




