package com.pgmanager.tenant.service;
import com.pgmanager.common.enums.TenantStatus;
import com.pgmanager.tenant.client.RoomServiceClient;
import com.pgmanager.tenant.client.PaymentServiceClient;
import com.pgmanager.tenant.context.UserContext;
import com.pgmanager.tenant.dto.*;
import com.pgmanager.tenant.entity.Tenant;
import com.pgmanager.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository  tenantRepository;
    private final RoomServiceClient roomClient;
    private final PaymentServiceClient paymentClient;
    private final com.pgmanager.tenant.client.AuthServiceClient authClient;
    private final RestTemplate restTemplate;

    @Value("${payment-service.url}")
    private String paymentServiceUrl;

    // ── Create Tenant ──────────────────────────────────────
    @Override
    public TenantResponse createTenant(TenantRequest req) {
        Long userId = UserContext.getUserId();
        String userEmail = UserContext.getUserEmail();

        if (tenantRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered: " + req.getEmail());
        }

        String roomNumber = null;
        TenantStatus status = TenantStatus.PENDING;

        if (req.getRoomId() != null) {
            roomNumber = roomClient.getRoomNumber(req.getRoomId());
            status = TenantStatus.ACTIVE;
            roomClient.incrementOccupancy(req.getRoomId());
        }

        Tenant tenant = Tenant.builder()
                .userId(userId)
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .roomId(req.getRoomId())
                .roomNumber(roomNumber)
                .moveInDate(req.getMoveInDate())
                .monthlyRent(req.getMonthlyRent())
                .securityDeposit(req.getSecurityDeposit())
                .rentDueDay(req.getRentDueDay())
                .idProofType(req.getIdProofType() != null ? req.getIdProofType() : null)
                .idNumber(req.getIdNumber())
                .emergencyContact(req.getEmergencyContact())
                .emergencyPhone(req.getEmergencyPhone())
                .permanentAddress(req.getPermanentAddress())
                .status(status)
                .build();

        tenant = tenantRepository.save(tenant);
        
        authClient.logEvent(userId, userEmail, "TENANT_ADDED", "Tenant " + tenant.getFullName() + " added");

        // Record initial payment if joining now
        if (tenant.getStatus() == TenantStatus.ACTIVE && tenant.getMonthlyRent() != null) {
            paymentClient.recordInitialPayment(tenant.getId(), tenant.getMonthlyRent(), "Initial rent paid on joining day");
        }

        return toResponse(tenant);
    }

    // ── Get All Tenants (Paginated) ────────────────────────
    @Override
    public Page<TenantResponse> getAllTenants(TenantStatus status, String search, Pageable pageable) {
        Long userId = UserContext.getUserId();
        boolean hasStatus = status != null;
        boolean hasSearch = search != null && !search.isBlank();
        Page<Tenant> tenants;
        
        if (hasStatus && hasSearch) {
            tenants = tenantRepository.searchByStatus(userId, status, search, pageable);
        } else if (hasStatus) {
            tenants = tenantRepository.findByUserIdAndStatus(userId, status, pageable);
        } else if (hasSearch) {
            tenants = tenantRepository.search(userId, search, pageable);
        } else {
            tenants = tenantRepository.findByUserId(userId, pageable);
        }
        
        return tenants.map(this::toResponse);
    }

    // ── Get Tenant By ID (detail view) ─────────────────────
    @Override
    public TenantDetailResponse getTenantById(Long id) {
        Tenant t = findById(id);
        
        // Correct duration calculation using Period
        long months = 0;
        if (t.getMoveInDate() != null) {
            LocalDate end = (t.getMoveOutDate() != null) ? t.getMoveOutDate() : LocalDate.now();
            Period period = Period.between(t.getMoveInDate(), end);
            months = period.getYears() * 12L + period.getMonths();
        }

        // Fetch payment summary from payment-service
        PaymentServiceClient.TenantPaymentSummary summary = paymentClient.getTenantPaymentSummary(id);

        return TenantDetailResponse.builder()
                .id(t.getId())
                .fullName(t.getFullName())
                .phone(t.getPhone())
                .email(t.getEmail())
                .roomId(t.getRoomId())
                .roomNumber(t.getRoomNumber())
                .moveInDate(t.getMoveInDate())
                .moveOutDate(t.getMoveOutDate())
                .monthlyRent(t.getMonthlyRent())
                .securityDeposit(t.getSecurityDeposit())
                .rentDueDay(t.getRentDueDay())
                .idProofType(t.getIdProofType())
                .idNumber(t.getIdNumber())
                .emergencyContact(t.getEmergencyContact())
                .emergencyPhone(t.getEmergencyPhone())
                .permanentAddress(t.getPermanentAddress())
                .status(t.getStatus())
                .totalPaid(summary.getTotalPaid())
                .outstanding(summary.getOutstanding())
                .stayDurationMonths(months)
                .isGoodStanding(summary.getOutstanding().compareTo(BigDecimal.ZERO) <= 0)
                .build();
    }

    // ── Update Tenant ──────────────────────────────────────
    @Override
    public TenantResponse updateTenant(Long id, TenantRequest req) {
        Tenant t = findById(id);
        t.setFullName(req.getFullName());
        t.setPhone(req.getPhone());
        t.setEmail(req.getEmail());
        t.setMonthlyRent(req.getMonthlyRent());
        t.setSecurityDeposit(req.getSecurityDeposit());
        t.setRentDueDay(req.getRentDueDay());
        if (req.getIdProofType() != null) t.setIdProofType(req.getIdProofType());
        t.setIdNumber(req.getIdNumber());
        t.setEmergencyContact(req.getEmergencyContact());
        t.setEmergencyPhone(req.getEmergencyPhone());
        t.setPermanentAddress(req.getPermanentAddress());
        return toResponse(tenantRepository.save(t));
    }

    // ── Delete Tenant ──────────────────────────────────────
    @Override
    public void deleteTenant(Long id) {
        Tenant t = findById(id);
        if (t.getStatus() == TenantStatus.ACTIVE) {
            throw new RuntimeException("Cannot delete an ACTIVE tenant. Please perform 'Move Out' first to clear room occupancy and dues.");
        }
        tenantRepository.delete(t);
    }

    // ── Assign Room to PENDING Tenant ──────────────────────
    @Override
    public TenantResponse assignRoom(Long id, AssignRoomRequest req) {
        Tenant t = findById(id);
        if (t.getStatus() != TenantStatus.PENDING) {
            throw new RuntimeException("Only PENDING tenants can be assigned a room.");
        }
        String roomNumber = roomClient.getRoomNumber(req.getRoomId());
        t.setRoomId(req.getRoomId());
        t.setRoomNumber(roomNumber);
        if (req.getMoveInDate() != null) t.setMoveInDate(req.getMoveInDate());
        if (req.getMonthlyRent() != null) t.setMonthlyRent(req.getMonthlyRent());
        if (req.getSecurityDeposit() != null) t.setSecurityDeposit(req.getSecurityDeposit());
        if (req.getRentDueDay() != null) t.setRentDueDay(req.getRentDueDay());
        t.setStatus(TenantStatus.ACTIVE);
        roomClient.incrementOccupancy(req.getRoomId());
        
        t = tenantRepository.save(t);

        // Record initial payment on assignment
        if (t.getMonthlyRent() != null) {
            paymentClient.recordInitialPayment(t.getId(), t.getMonthlyRent(), "Rent paid on joining day (assignment)");
        }

        return toResponse(t);
    }

    // ── Move Out ───────────────────────────────────────────
    @Override
    public TenantResponse moveOut(Long id, MoveOutRequest req) {
        Tenant t = findById(id);
        if (t.getStatus() != TenantStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE tenants can move out.");
        }

        try {
            String url = paymentServiceUrl + "/payments/tenant/" + id;
            List<?> payments = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<?>>() {}
            ).getBody();

            if (payments != null) {
                boolean hasOutstanding = payments.stream().anyMatch(p -> {
                    if (p instanceof java.util.Map) {
                        java.util.Map<?,?> map = (java.util.Map<?,?>) p;
                        Object status = map.get("status");
                        return "OVERDUE".equals(status) || "PENDING".equals(status) || "PARTIAL".equals(status);
                    }
                    return false;
                });
                if (hasOutstanding) {
                    throw new RuntimeException("Cannot move out — tenant has outstanding dues. Clear all payments first.");
                }
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            System.out.println("Warning: Could not verify payments for tenant: " + id);
        }

        Long roomId = t.getRoomId();
        t.setMoveOutDate(req.getMoveOutDate() != null ? req.getMoveOutDate() : LocalDate.now());
        t.setStatus(TenantStatus.INACTIVE);
        t.setRoomId(null);

        if (roomId != null) {
            try {
                roomClient.decrementOccupancy(roomId);
            } catch (Exception e) {
                System.out.println("Warning: Could not update room occupancy for roomId: " + roomId);
            }
        }

        return toResponse(tenantRepository.save(t));
    }

    @Override
    public List<TenantResponse> getTenantsByRoom(Long roomId) {
        // Here we might need to verify if the room belongs to the user, 
        // but room-service should handle its own isolation.
        return tenantRepository.findByRoomIdAndStatusIn(roomId, List.of(TenantStatus.ACTIVE, TenantStatus.PENDING))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Stats ──────────────────────────────────────────────
    @Override
    public TenantStatsResponse getStats() {
        Long userId = UserContext.getUserId();
        LocalDate now   = LocalDate.now();
        LocalDate start = now.withDayOfMonth(1);
        LocalDate end   = now.withDayOfMonth(now.lengthOfMonth());
        return TenantStatsResponse.builder()
                .active(tenantRepository.countByUserIdAndStatus(userId, TenantStatus.ACTIVE))
                .pending(tenantRepository.countByUserIdAndStatus(userId, TenantStatus.PENDING))
                .inactive(tenantRepository.countByUserIdAndStatus(userId, TenantStatus.INACTIVE))
                .moveOutsThisMonth(tenantRepository.countMoveOutsBetween(userId, start, end))
                .build();
    }

    // ── Private Helpers ────────────────────────────────────
    private Tenant findById(Long id) {
        Long userId = UserContext.getUserId();
        return tenantRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Tenant not found or access denied: " + id));
    }

    private TenantResponse toResponse(Tenant t) {
        boolean overdue = false;
        long daysOverdue = 0;

        if (t.getStatus() == TenantStatus.ACTIVE && t.getRentDueDay() != null) {
            LocalDate today = LocalDate.now();
            LocalDate dueDate = today.withDayOfMonth(Math.min(t.getRentDueDay(), today.lengthOfMonth()));

            if (today.isAfter(dueDate)) {
                try {
                    String monthStr = today.withDayOfMonth(1).toString();
                    String url = paymentServiceUrl + "/payments/tenant/" + t.getId() + "?month=" + monthStr;
                    java.util.Map<?,?> p = restTemplate.getForObject(url, java.util.Map.class);
                    
                    if (p == null || !"PAID".equals(p.get("status"))) {
                        overdue = true;
                        daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(dueDate, today);
                    }
                } catch (Exception e) {
                    overdue = true;
                    daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(dueDate, today);
                }
            }
        }
        return TenantResponse.builder()
                .id(t.getId())
                .fullName(t.getFullName())
                .email(t.getEmail())
                .phone(t.getPhone())
                .roomNumber(t.getRoomNumber())
                .roomId(t.getRoomId())
                .moveInDate(t.getMoveInDate())
                .monthlyRent(t.getMonthlyRent())
                .securityDeposit(t.getSecurityDeposit())
                .rentDueDay(t.getRentDueDay())
                .status(t.getStatus())
                .idProofType(t.getIdProofType())
                .isOverdue(overdue)
                .daysOverdue(daysOverdue)
                .build();
    }
}
