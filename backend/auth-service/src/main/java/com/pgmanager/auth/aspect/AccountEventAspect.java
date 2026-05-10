package com.pgmanager.auth.aspect;

import com.pgmanager.auth.entity.AccountEvent;
import com.pgmanager.auth.entity.User;
import com.pgmanager.auth.repository.AccountEventRepository;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class AccountEventAspect {

    private final AccountEventRepository accountEventRepository;

    @AfterReturning(pointcut = "execution(* com.pgmanager.auth.service.AuthServiceImpl.login(..))", returning = "result")
    public void onLogin(JoinPoint jp, Object result) {
        logEvent(result, "LOGIN", "User logged in successfully");
    }

    @AfterReturning(pointcut = "execution(* com.pgmanager.auth.service.AuthServiceImpl.register(..))", returning = "result")
    public void onRegister(JoinPoint jp, Object result) {
        logEvent(result, "ACCOUNT_CREATED", "New account registered");
    }

    private void logEvent(Object result, String eventType, String description) {
        try {
            // Using reflection or casting to extract userId from AuthResponse
            // result is AuthResponse
            java.lang.reflect.Method getUserId = result.getClass().getMethod("getUserId");
            Long userId = (Long) getUserId.invoke(result);
            
            java.lang.reflect.Method getEmail = result.getClass().getMethod("getEmail");
            String email = (String) getEmail.invoke(result);

            AccountEvent event = AccountEvent.builder()
                    .userId(userId)
                    .eventType(eventType)
                    .description(description)
                    .performedBy(email)
                    .build();
            accountEventRepository.save(event);
        } catch (Exception e) {
            // Silently fail or log error
        }
    }
}
