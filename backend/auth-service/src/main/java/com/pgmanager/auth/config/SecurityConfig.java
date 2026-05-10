package com.pgmanager.auth.config;

import com.pgmanager.auth.entity.User;
import com.pgmanager.auth.repository.UserRepository;
import com.pgmanager.common.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserRepository userRepository;
    private final com.pgmanager.auth.repository.StaffUserRepository staffUserRepository;
    private final JwtUtil        jwtUtil;
    private final OAuth2SuccessHandler oauth2SuccessHandler;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            // Check main users (OWNER, SUPER_ADMIN)
            var user = userRepository.findByEmail(username);
            if (user.isPresent()) return user.get();

            // Check staff users
            var staff = staffUserRepository.findByEmail(username);
            if (staff.isPresent()) {
                var s = staff.get();
                // Map StaffUser to a UserDetails implementation or our User entity
                // For simplicity, let's assume we can treat them similarly or we need a wrapper
                // Since our User entity implements UserDetails, let's create a temporary User object for the session
                return User.builder()
                        .email(s.getEmail())
                        .passwordHash("") // Staff login via OAuth or set a password later
                        .role(com.pgmanager.common.enums.Role.STAFF)
                        .active(s.isActive())
                        .fullName(s.getName())
                        .tenantId(s.getTenantId())
                        .build();
            }

            throw new UsernameNotFoundException("User not found: " + username);
        };
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/auth/register",
                                "/auth/login",
                                "/auth/refresh",
                                "/auth/internal/**",
                                "/actuator/health",
                                "/oauth2/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oauth2SuccessHandler)
                )
                .addFilterBefore(
                        new JwtAuthenticationFilter(jwtUtil, userRepository),
                        UsernamePasswordAuthenticationFilter.class)
                .build();
    }

}

