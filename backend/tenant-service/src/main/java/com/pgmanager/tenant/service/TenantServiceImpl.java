package com.pgmanager.tenant.service;
import com.pgmanager.tenant.client.RoomServiceClient;
import com.pgmanager.tenant.dto.*;
import com.pgmanager.tenant.entity.Tenant;
import com.pgmanager.tenant.enums.TenantStatus;
import com.pgmanager.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository  tenantRepository;
    private final RoomServiceClient roomClient;

    // ── Create Tenant ──────────────────────────────────────
    // If roomId provided: ACTIVE + call room-service OCCUPIED
    // If no roomId: PENDING (assign room later)
    @Override
    public TenantResponse createTenant(TenantRequest req) {
        if (tenantRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered: " + req.getEmail());
        }

        String roomNumber = null;
        TenantStatus status = TenantStatus.PENDING;

        if (req.getRoomId() != null) {
            // Verify room not already occupied
            tenantRepository.findByRoomIdAndStatus(req.getRoomId(), TenantStatus.ACTIVE)
                    .ifPresent(t -> { throw new RuntimeException(
                            "Room already has an active tenant: " + t.getFullName()); });
            roomNumber = roomClient.getRoomNumber(req.getRoomId());
            status = TenantStatus.ACTIVE;
            roomClient.markOccupied(req.getRoomId());
        }

        Tenant tenant = Tenant.builder()
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

        return toResponse(tenantRepository.save(tenant));
    }

    // ── Get All Tenants ────────────────────────────────────
    @Override
    public List<TenantResponse> getAllTenants(TenantStatus status, String search) {
        boolean hasStatus = status != null;
        boolean hasSearch = search != null && !search.isBlank();
        List<Tenant> tenants;
        if (hasStatus && hasSearch) {
            tenants = tenantRepository.searchByStatus(status, search);
        } else if (hasStatus) {
            tenants = tenantRepository.findByStatus(status);
        } else if (hasSearch) {
            tenants = tenantRepository.search(search);
        } else {
            tenants = tenantRepository.findAll();
        }
        return tenants.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Get Tenant By ID (detail view) ─────────────────────
    @Override
    public TenantDetailResponse getTenantById(Long id) {
        Tenant t = findById(id);
        long months = t.getMoveInDate() != null
                ? ChronoUnit.MONTHS.between(t.getMoveInDate(), LocalDate.now())
                : 0;
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
                // Payment summary placeholder - Phase 4 fills these from payment-service
                .totalPaid(BigDecimal.ZERO)
                .outstanding(BigDecimal.ZERO)
                .stayDurationMonths(months)
                .isGoodStanding(true)
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
            throw new RuntimeException("Cannot delete an ACTIVE tenant. Move out first.");
        }
        tenantRepository.delete(t);
    }

    // ── Assign Room to PENDING Tenant ──────────────────────
    // This is the "Assign Room" button in Screenshot 1
    @Override
    public TenantResponse assignRoom(Long id, AssignRoomRequest req) {
        Tenant t = findById(id);
        if (t.getStatus() != TenantStatus.PENDING) {
            throw new RuntimeException("Only PENDING tenants can be assigned a room.");
        }
        // Check room not already occupied by another active tenant
        tenantRepository.findByRoomIdAndStatus(req.getRoomId(), TenantStatus.ACTIVE)
                .ifPresent(existing -> { throw new RuntimeException(
                        "Room already occupied by: " + existing.getFullName()); });

        String roomNumber = roomClient.getRoomNumber(req.getRoomId());
        t.setRoomId(req.getRoomId());
        t.setRoomNumber(roomNumber);
        t.setMoveInDate(req.getMoveInDate());
        t.setMonthlyRent(req.getMonthlyRent());
        t.setSecurityDeposit(req.getSecurityDeposit());
        t.setRentDueDay(req.getRentDueDay());
        t.setStatus(TenantStatus.ACTIVE);
        roomClient.markOccupied(req.getRoomId());   // room-service call
        return toResponse(tenantRepository.save(t));
    }

    // ── Move Out ───────────────────────────────────────────
    // "Move Out" button in Screenshot 3
    @Override
    public TenantResponse moveOut(Long id, MoveOutRequest req) {
        Tenant t = findById(id);
        if (t.getStatus() != TenantStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE tenants can move out.");
        }
        Long roomId = t.getRoomId();
        t.setMoveOutDate(req.getMoveOutDate());
        t.setStatus(TenantStatus.INACTIVE);
        t.setRoomId(null);
        // Keep roomNumber for history display
        roomClient.markAvailable(roomId);           // room-service call
        return toResponse(tenantRepository.save(t));
    }

    // ── Stats ──────────────────────────────────────────────
    @Override
    public TenantStatsResponse getStats() {
        LocalDate now   = LocalDate.now();
        LocalDate start = now.withDayOfMonth(1);
        LocalDate end   = now.withDayOfMonth(now.lengthOfMonth());
        return TenantStatsResponse.builder()
                .active(tenantRepository.countByStatus(TenantStatus.ACTIVE))
                .pending(tenantRepository.countByStatus(TenantStatus.PENDING))
                .inactive(tenantRepository.countByStatus(TenantStatus.INACTIVE))
                .moveOutsThisMonth(tenantRepository.countMoveOutsBetween(start, end))
                .build();
    }

    // ── Private Helpers ────────────────────────────────────
    private Tenant findById(Long id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found: " + id));
    }

    private TenantResponse toResponse(Tenant t) {
        // Calculate overdue status (Screenshot 1 yellow row)
        boolean overdue = false;
        long daysOverdue = 0;
        if (t.getStatus() == TenantStatus.ACTIVE
                && t.getRentDueDay() != null
                && t.getMoveInDate() != null) {
            LocalDate today    = LocalDate.now();
            LocalDate dueDate  = today.withDayOfMonth(t.getRentDueDay());
            if (today.isAfter(dueDate)) {
                overdue    = true;
                daysOverdue = ChronoUnit.DAYS.between(dueDate, today);
            }
        }
        return TenantResponse.builder()
                .id(t.getId())
                .fullName(t.getFullName())
                .email(t.getEmail())
                .phone(t.getPhone())
                .roomNumber(t.getRoomNumber())
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

