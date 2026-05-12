package com.pgmanager.api.auth.service;

import com.pgmanager.api.auth.dto.*;
import com.pgmanager.common.dto.*;
import com.pgmanager.api.auth.entity.LimitRequest;
import com.pgmanager.api.auth.entity.OwnerProfile;
import com.pgmanager.api.auth.entity.User;
import com.pgmanager.api.auth.entity.UserActivity;
import com.pgmanager.common.enums.AccountStatus;
import com.pgmanager.common.enums.Role;
import com.pgmanager.api.auth.repository.*;
import com.pgmanager.api.auth.util.JwtUtil;
import com.pgmanager.common.util.SecurityUtils;
import com.pgmanager.api.maintenance.repository.GeneralExpenseRepository;
import com.pgmanager.api.maintenance.repository.MaintenanceTicketRepository;
import com.pgmanager.api.notification.repository.NotificationRepository;
import com.pgmanager.api.payment.repository.PaymentRepository;
import com.pgmanager.api.room.repository.RoomRepository;
import com.pgmanager.api.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final PgSettingsRepository pgSettingsRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final PaymentRepository paymentRepository;
    private final MaintenanceTicketRepository maintenanceTicketRepository;
    private final GeneralExpenseRepository generalExpenseRepository;
    private final NotificationRepository notificationRepository;
    private final UserActivityRepository userActivityRepository;
    private final LimitRequestRepository limitRequestRepository;
    private final com.pgmanager.api.common.audit.AuditLogRepository auditLogRepository;
    private final com.pgmanager.api.notification.service.NotificationService notificationService;
    
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OwnerProfileDTO provisionOwner(RegisterRequest req) {
        User user;
        boolean wasPending = false;

        if (userRepository.existsByEmail(req.getEmail())) {
            user = userRepository.findByEmail(req.getEmail()).get();
            // If already active, then it's a real duplicate
            if (user.getStatus() == AccountStatus.ACTIVE) {
                throw new RuntimeException("Email already registered and active");
            }

            if (user.getStatus() == AccountStatus.PENDING) {
                wasPending = true;
            }

            // If pending, we "complete" the provisioning
            user.setFullName(req.getFullName());
            user.setPhone(req.getPhone());

            // HYBRID LOGIC: If they were pending, they already chose a password.
            // Only set a new password if they weren't pending (e.g. some other state) 
            // or if we decide to overwrite (not recommended for this flow).
            if (!wasPending) {
                user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
                user.setFirstLogin(true);
                user.setTempPassword(req.getPassword());
            } else {
                // Keep existing password, but activate account
                user.setFirstLogin(false);
                user.setTempPassword(null);
            }

            user.setActive(true);
            user.setStatus(AccountStatus.ACTIVE);
            user = userRepository.save(user);
        } else {
            user = User.builder()
                    .fullName(req.getFullName())
                    .email(req.getEmail())
                    .phone(req.getPhone())
                    .passwordHash(passwordEncoder.encode(req.getPassword()))
                    .role(Role.OWNER)
                    .active(true)
                    .isFirstLogin(true)
                    .tempPassword(req.getPassword())
                    .status(AccountStatus.ACTIVE)
                    .build();

            user = userRepository.save(user);
            user.setOwnerId(user.getId());
            user = userRepository.save(user);
        }

        // Capture flags from req (extended)
        OwnerProfile profile = ownerProfileRepository.findByUserId(user.getId())
                .orElse(new OwnerProfile());

        profile.setUserId(user.getId());
        profile.setDashboardEnabled(req.isDashboardEnabled());
        profile.setPaymentsEnabled(req.isPaymentsEnabled());
        profile.setReportsEnabled(req.isReportsEnabled());
        profile.setWhatsappEnabled(req.isWhatsappEnabled());
        profile.setMaintenanceEnabled(req.isMaintenanceEnabled());
        profile.setMaxRooms(req.getMaxRooms() > 0 ? req.getMaxRooms() : 50);
        profile.setMaxTenants(req.getMaxTenants() > 0 ? req.getMaxTenants() : 200);

        ownerProfileRepository.save(profile);

        String logMsg = wasPending ? "Account activated (Preserved user password)" : "Account provisioned by Admin";
        logActivity(user.getId(), user.getOwnerId(), "PROVISIONED", logMsg);

        return mapToDTO(user);
    }
    @Override
    public List<OwnerProfileDTO> getAllOwners() {
        return userRepository.findAllByRole(Role.OWNER).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public OwnerProfileDTO getOwnerProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDTO(user);
    }

    @Override
    public OwnerStatsResponse getOwnerStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long ownerId = user.getOwnerId();
        
        java.time.LocalDate firstOfMonth = java.time.LocalDate.now().withDayOfMonth(1);

        return OwnerStatsResponse.builder()
                .roomsCount(roomRepository.countByOwnerId(ownerId))
                .tenantsCount(tenantRepository.countByOwnerIdAndStatus(ownerId, com.pgmanager.common.enums.TenantStatus.ACTIVE))
                .collectedThisMonth(paymentRepository.sumCollectedByOwnerAndMonth(ownerId, firstOfMonth))
                .openTicketsCount(maintenanceTicketRepository.countByOwnerIdAndStatus(ownerId, com.pgmanager.common.enums.MaintenanceStatus.OPEN))
                .build();
    }

    @Override
    @Transactional
    public OwnerProfileDTO updateOwnerProfile(Long userId, OwnerProfileDTO updates) {
        OwnerProfile profile = ownerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Owner profile not found"));
        
        profile.setMaxRooms(updates.getMaxRooms());
        profile.setMaxTenants(updates.getMaxTenants());
        profile.setTrialEndDate(updates.getTrialEndDate());
        
        profile.setDashboardEnabled(updates.isDashboardEnabled());
        profile.setPaymentsEnabled(updates.isPaymentsEnabled());
        profile.setReportsEnabled(updates.isReportsEnabled());
        profile.setWhatsappEnabled(updates.isWhatsappEnabled());
        profile.setMaintenanceEnabled(updates.isMaintenanceEnabled());
        profile.setExpensesEnabled(updates.isExpensesEnabled());
        profile.setBulkOpsEnabled(updates.isBulkOpsEnabled());
        profile.setPdfReceiptsEnabled(updates.isPdfReceiptsEnabled());
        
        ownerProfileRepository.save(profile);
        
        return mapToDTO(userRepository.findById(userId).get());
    }

    @Override
    @Transactional
    public void updateOwnerStatus(Long userId, UpdateOwnerStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        AccountStatus oldStatus = user.getStatus();
        AccountStatus newStatus = AccountStatus.valueOf(request.getStatus());
        user.setStatus(newStatus);
        
        // Sync active flag: only true if status is ACTIVE
        user.setActive(newStatus == AccountStatus.ACTIVE);
        
        if (newStatus == AccountStatus.SUSPENDED || newStatus == AccountStatus.INACTIVE) {
            user.setRefreshToken(null); // Force logout
        }

        // Send Email Notification on Activation
        if (oldStatus != AccountStatus.ACTIVE && newStatus == AccountStatus.ACTIVE) {
            String welcomeMsg = "Hi " + user.getFullName() + ",\n\n" +
                    "Your PG Manager account has been activated! You can now log in and start managing your property.\n\n" +
                    "Login URL: https://pgmanager.app/login\n" +
                    "Email: " + user.getEmail() + "\n\n" +
                    "If you registered yourself, please use your chosen password. If you were invited by an admin, please use the temporary password provided to you.\n\n" +
                    "Welcome aboard!";
            
            notificationService.sendNotification(com.pgmanager.api.notification.dto.NotificationRequest.builder()
                    .recipient(user.getEmail())
                    .subject("Account Activated - Welcome to PG Manager")
                    .message(welcomeMsg)
                    .type("EMAIL")
                    .ownerId(user.getOwnerId())
                    .build());
        }

        userRepository.save(user);
    }

    @Override
    public AuthResponse impersonateOwner(Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        if (owner.getRole() != Role.OWNER) {
            throw new RuntimeException("Can only impersonate PG Owners");
        }

        Long adminId = SecurityUtils.getCurrentUserId();
        String impersonationToken = jwtUtil.generateImpersonationToken(owner, adminId);
        
        return AuthResponse.builder()
                .accessToken(impersonationToken)
                .refreshToken(null) // No refresh token for impersonation
                .userId(owner.getId())
                .email(owner.getEmail())
                .fullName(owner.getFullName())
                .role(owner.getRole().name())
                .ownerId(owner.getOwnerId())
                .build();
    }

    @Override
    @Transactional
    public void forcePasswordReset(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setFirstLogin(true);
        user.setRefreshToken(null);
        user.setTempPassword("RESET-" + System.currentTimeMillis() % 10000);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteOwnerPermanently(Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        if (owner.getRole() != Role.OWNER) {
            throw new RuntimeException("Can only permanently delete PG Owners");
        }

        Long ownerId = owner.getOwnerId();

        // 1. Purge business data
        paymentRepository.deleteAllByOwnerId(ownerId);
        maintenanceTicketRepository.deleteAllByOwnerId(ownerId);
        generalExpenseRepository.deleteAllByOwnerId(ownerId);
        tenantRepository.deleteAllByOwnerId(ownerId);
        roomRepository.deleteAllByOwnerId(ownerId);
        notificationRepository.deleteAllByOwnerId(ownerId);
        pgSettingsRepository.deleteAllByOwnerId(ownerId);
        auditLogRepository.deleteAllByOwnerId(ownerId);

        // 2. Purge auth data
        ownerProfileRepository.deleteByUserId(userId);
        userActivityRepository.deleteAllByOwnerId(ownerId);
        
        // 3. Delete all staff members associated with this owner (EXCEPT the owner themselves to avoid overlap)
        List<User> staff = userRepository.findByOwnerId(ownerId).stream()
                .filter(u -> !u.getId().equals(userId))
                .collect(Collectors.toList());
        userRepository.deleteAll(staff);
        
        // 4. Finally delete the owner user itself
        userRepository.delete(owner);
    }

    @Override
    public void sendMessage(Long userId, String message, String deliveryMode) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        if ("EMAIL".equalsIgnoreCase(deliveryMode)) {
            notificationService.sendNotification(com.pgmanager.api.notification.dto.NotificationRequest.builder()
                    .recipient(owner.getEmail())
                    .subject("Message from PG Manager Admin")
                    .message(message)
                    .type("EMAIL")
                    .ownerId(owner.getOwnerId())
                    .build());
        }

        logActivity(owner.getId(), owner.getOwnerId(), "MESSAGE_SENT", 
                "Admin sent message via " + deliveryMode + ": " + (message.length() > 30 ? message.substring(0, 27) + "..." : message));
    }

    @Override
    public List<UserActivityDTO> getOwnerTimeline(Long userId) {
        return userActivityRepository.findByUserIdOrderByTimestampDesc(userId).stream()
                .map(a -> UserActivityDTO.builder()
                        .actionType(a.getActionType())
                        .description(a.getDescription())
                        .timestamp(a.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public OnboardingChecklistDTO getOnboardingChecklist(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long ownerId = user.getOwnerId();

        return OnboardingChecklistDTO.builder()
                .provisioned(true)
                .emailDelivered(true) // Mock
                .firstLoginCompleted(!user.isFirstLogin())
                .passwordChanged(user.getTempPassword() == null)
                .profileSetup(pgSettingsRepository.findByOwnerId(ownerId).isPresent())
                .firstRoomAdded(roomRepository.countByOwnerId(ownerId) > 0)
                .firstTenantAdded(tenantRepository.countByOwnerIdAndStatus(ownerId, com.pgmanager.common.enums.TenantStatus.ACTIVE) > 0)
                .build();
    }

    @Override
    public List<LimitRequestDTO> getPendingLimitRequests() {
        return limitRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream()
                .map(lr -> {
                    User owner = userRepository.findById(lr.getOwnerId()).orElse(null);
                    return LimitRequestDTO.builder()
                            .id(lr.getId())
                            .ownerId(lr.getOwnerId())
                            .ownerName(owner != null ? owner.getFullName() : "Unknown")
                            .requestType(lr.getRequestType())
                            .currentLimit(lr.getCurrentLimit())
                            .requestedLimit(lr.getRequestedLimit())
                            .status(lr.getStatus())
                            .createdAt(lr.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void processLimitRequest(Long requestId, String action, String adminNote) {
        LimitRequest lr = limitRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (!lr.getStatus().equals("PENDING")) {
            throw new RuntimeException("Request already processed");
        }

        if ("APPROVE".equalsIgnoreCase(action)) {
            lr.setStatus("APPROVED");
            OwnerProfile profile = ownerProfileRepository.findByUserId(lr.getOwnerId())
                    .orElseThrow(() -> new RuntimeException("Owner profile not found"));
            
            if ("ROOMS".equalsIgnoreCase(lr.getRequestType())) {
                profile.setMaxRooms(lr.getRequestedLimit());
            } else {
                profile.setMaxTenants(lr.getRequestedLimit());
            }
            ownerProfileRepository.save(profile);
            logActivity(lr.getOwnerId(), lr.getOwnerId(), "LIMIT_INCREASED", 
                    "Admin approved " + lr.getRequestType() + " increase to " + lr.getRequestedLimit());
        } else {
            lr.setStatus("REJECTED");
        }
        
        lr.setAdminNote(adminNote);
        limitRequestRepository.save(lr);
    }

    @Override
    public PlatformStatsResponse getPlatformStats() {
        java.time.LocalDate firstOfMonth = java.time.LocalDate.now().withDayOfMonth(1);
        
        return PlatformStatsResponse.builder()
                .totalOwners(userRepository.countByRole(Role.OWNER))
                .activeOwners(userRepository.countByRoleAndStatus(Role.OWNER, AccountStatus.ACTIVE))
                .totalTenants(tenantRepository.countByStatus(com.pgmanager.common.enums.TenantStatus.ACTIVE))
                .totalRooms(roomRepository.count())
                .totalRevenueThisMonth(paymentRepository.sumAllCollectedByMonth(firstOfMonth))
                .pendingLimitRequests(limitRequestRepository.countByStatus("PENDING"))
                .openMaintenanceTickets(maintenanceTicketRepository.countByStatus(com.pgmanager.common.enums.MaintenanceStatus.OPEN))
                .build();
    }

    private void logActivity(Long userId, Long ownerId, String type, String desc) {
        userActivityRepository.save(UserActivity.builder()
                .userId(userId)
                .ownerId(ownerId)
                .actionType(type)
                .description(desc)
                .timestamp(java.time.LocalDateTime.now())
                .build());
    }

    private OwnerProfileDTO mapToDTO(User user) {
        OwnerProfile profile = ownerProfileRepository.findByUserId(user.getId())
                .orElse(OwnerProfile.builder().build());
        
        long rCount = roomRepository.countByOwnerId(user.getOwnerId());
        long tCount = tenantRepository.countByOwnerIdAndStatus(user.getOwnerId(), com.pgmanager.common.enums.TenantStatus.ACTIVE);

        return OwnerProfileDTO.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .status(user.getStatus().name())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .roomCount(rCount)
                .tenantCount(tCount)
                .trialEndDate(profile.getTrialEndDate())
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
                .healthScore(user.getHealthScore())
                .tempPassword(user.getTempPassword())
                .build();
    }
}





