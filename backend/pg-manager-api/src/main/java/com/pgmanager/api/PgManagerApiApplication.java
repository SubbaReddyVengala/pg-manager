package com.pgmanager.api;

import com.pgmanager.api.auth.entity.User;
import com.pgmanager.common.enums.Role;
import com.pgmanager.api.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableCaching
@EnableAsync
public class PgManagerApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(PgManagerApiApplication.class, args);
    }

    @Bean
    public CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            userRepository.findByEmail("admin@pgmanager.com").ifPresentOrElse(
                admin -> {
                    boolean changed = false;
                    if (!admin.isActive() || admin.getStatus() != com.pgmanager.common.enums.AccountStatus.ACTIVE) {
                        admin.setActive(true);
                        admin.setStatus(com.pgmanager.common.enums.AccountStatus.ACTIVE);
                        changed = true;
                    }
                    // Always ensure password is reset to the default for this managed admin account
                    admin.setPasswordHash(passwordEncoder.encode("admin1234"));
                    admin.setFirstLogin(false);
                    userRepository.save(admin);
                    System.out.println(">>> [SECURITY] Admin account synchronized (Active: " + admin.isActive() + ", Password Reset: admin1234).");
                },
                () -> {
                    User admin = User.builder()
                            .email("admin@pgmanager.com")
                            .fullName("System Administrator")
                            .passwordHash(passwordEncoder.encode("admin1234"))
                            .role(Role.SUPER_ADMIN)
                            .active(true)
                            .status(com.pgmanager.common.enums.AccountStatus.ACTIVE)
                            .isFirstLogin(false)
                            .build();
                    userRepository.save(admin);
                    System.out.println(">>> [SECURITY] Default SUPER_ADMIN created.");
                }
            );
        };
    }
}




