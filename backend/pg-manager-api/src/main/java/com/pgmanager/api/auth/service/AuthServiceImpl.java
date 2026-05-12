package com.pgmanager.api.auth.service;

import com.pgmanager.api.auth.dto.*;
import com.pgmanager.common.dto.*;
import com.pgmanager.api.auth.entity.OwnerProfile;
import com.pgmanager.api.auth.entity.User;
import com.pgmanager.common.enums.Role;
import com.pgmanager.api.auth.repository.OwnerProfileRepository;
import com.pgmanager.api.auth.repository.UserRepository;
import com.pgmanager.api.auth.util.JwtUtil;
import com.pgmanager.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final com.pgmanager.api.notification.service.NotificationService notificationService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        
        com.pgmanager.common.util.ValidationUtils.validatePassword(req.getPassword());

        User user = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(Role.OWNER)
                .active(false) // Require Admin Approval
                .status(com.pgmanager.common.enums.AccountStatus.PENDING)
                .isFirstLogin(false) // User chose their own password, no forced reset needed
                .build();
        
        user = userRepository.save(user);
        user.setOwnerId(user.getId());
        user = userRepository.save(user);

        // Create Default Owner Profile
        OwnerProfile profile = OwnerProfile.builder()
                .userId(user.getId())
                .maxRooms(10) // Restricted for new accounts
                .maxTenants(20)
                .dashboardEnabled(true)
                .paymentsEnabled(false) // Disable until approved
                .reportsEnabled(false)
                .whatsappEnabled(false)
                .maintenanceEnabled(true)
                .expensesEnabled(false)
                .build();
        ownerProfileRepository.save(profile);

        // If pending, do not issue tokens. Return a basic response.
        if (user.getStatus() == com.pgmanager.common.enums.AccountStatus.PENDING) {
            return AuthResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole().name())
                    .ownerId(user.getOwnerId())
                    .build();
        }

        return buildTokenResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);
        
        return buildTokenResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest req) {
        User user = userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid current password");
        }

        com.pgmanager.common.util.ValidationUtils.validatePassword(req.getNewPassword());

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        user.setFirstLogin(false);
        user.setTempPassword(null); // Clear temp password once changed
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void initiatePasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("If your email is registered, you will receive a reset link shortly."));
        
        String token = java.util.UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(java.time.LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        String resetLink = "https://pgmanager.app/auth/reset-password?token=" + token;
        String message = "Hi " + user.getFullName() + ",\n\n" +
                "We received a request to reset your PG Manager password.\n" +
                "Click the link below to set a new password. This link expires in 15 minutes.\n\n" +
                resetLink + "\n\n" +
                "If you didn't request this, you can safely ignore this email.";

        notificationService.sendNotification(com.pgmanager.api.notification.dto.NotificationRequest.builder()
                .recipient(user.getEmail())
                .subject("Reset Your Password - PG Manager")
                .message(message)
                .type("EMAIL")
                .ownerId(user.getOwnerId())
                .build());
    }

    @Override
    @Transactional
    public void completePasswordReset(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));
        
        if (user.getResetTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("Reset token has expired");
        }

        com.pgmanager.common.util.ValidationUtils.validatePassword(newPassword);

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.setFirstLogin(false); // User now has a permanent password
        user.setTempPassword(null);
        userRepository.save(user);
    }

    private UserProfileResponse mapToProfile(User u) {
        return new UserProfileResponse(
            u.getId(), 
            u.getEmail(), 
            u.getFullName(), 
            u.getRole().name(), 
            u.getOwnerId(), 
            u.isFirstLogin(),
            u.getTempPassword()
        );
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(String token) {
        User user = userRepository.findByRefreshToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));
        return buildTokenResponse(user);
    }

    @Override
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setRefreshToken(null);
            userRepository.save(user);
        });
    }

    @Override
    @Transactional
    public UserProfileResponse createStaff(RegisterRequest req) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User staff = User.builder()
                .fullName(req.getFullName())
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role(Role.STAFF)
                .ownerId(ownerId)
                .active(true)
                .isFirstLogin(true)
                .tempPassword(req.getPassword()) // Also store for staff if needed
                .build();

        User saved = userRepository.save(staff);
        return mapToProfile(saved);
    }

    @Override
    public List<UserProfileResponse> getStaffMembers() {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        return userRepository.findByOwnerId(ownerId).stream()
                .filter(u -> u.getRole() == Role.STAFF)
                .map(this::mapToProfile)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteStaff(Long staffId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        
        if (!staff.getOwnerId().equals(SecurityUtils.getCurrentOwnerId())) {
            throw new RuntimeException("Unauthorized to delete this staff member");
        }
        
        userRepository.delete(staff);
    }

    private AuthResponse buildTokenResponse(User user) {
        String refreshToken = jwtUtil.generateRefreshToken();
        user.setRefreshToken(refreshToken);
        userRepository.save(user);
        
        OwnerProfileDTO profileDTO = null;
        if (user.getRole() == Role.OWNER || user.getRole() == Role.STAFF) {
            Long targetOwnerId = (user.getRole() == Role.OWNER) ? user.getId() : user.getOwnerId();
            profileDTO = ownerProfileRepository.findByUserId(targetOwnerId)
                    .map(this::mapProfileToDTO)
                    .orElse(null);
        }

        return AuthResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(user))
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .ownerId(user.getOwnerId())
                .isFirstLogin(user.isFirstLogin())
                .profile(profileDTO)
                .build();
    }

    private OwnerProfileDTO mapProfileToDTO(com.pgmanager.api.auth.entity.OwnerProfile profile) {
        return OwnerProfileDTO.builder()
                .userId(profile.getUserId())
                .maxRooms(profile.getMaxRooms())
                .maxTenants(profile.getMaxTenants())
                .dashboardEnabled(profile.isDashboardEnabled())
                .paymentsEnabled(profile.isPaymentsEnabled())
                .reportsEnabled(profile.isReportsEnabled())
                .whatsappEnabled(profile.isWhatsappEnabled())
                .maintenanceEnabled(profile.isMaintenanceEnabled())
                .expensesEnabled(profile.isExpensesEnabled())
                .bulkOpsEnabled(profile.isBulkOpsEnabled())
                .pdfReceiptsEnabled(profile.isPdfReceiptsEnabled())
                .build();
    }
}





