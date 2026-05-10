package com.pgmanager.api.payment.client;

import com.pgmanager.api.tenant.entity.Tenant;
import com.pgmanager.common.enums.TenantStatus;
import com.pgmanager.api.tenant.repository.TenantRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Component("paymentTenantServiceClient")
@RequiredArgsConstructor
@Slf4j
public class TenantServiceClient {

    private final TenantRepository tenantRepository;

    public List<TenantInfo> getActiveTenants(Long ownerId) {
        return tenantRepository.findByOwnerIdAndStatus(ownerId, TenantStatus.ACTIVE, org.springframework.data.domain.Pageable.unpaged())
                .getContent().stream()
                .map(this::mapToInfo)
                .collect(Collectors.toList());
    }

    public List<TenantInfo> getAllActiveTenantsIgnoreOwner() {
        // System level call for scheduler
        return tenantRepository.findAll().stream()
                .filter(t -> t.getStatus() == TenantStatus.ACTIVE)
                .map(this::mapToInfo)
                .collect(Collectors.toList());
    }

    public TenantInfo getTenant(Long id) {
        return tenantRepository.findById(id)
                .map(this::mapToInfo)
                .orElse(null);
    }

    public BigDecimal getTotalDeposits(Long ownerId) {
        return tenantRepository.findByOwnerIdAndStatus(ownerId, TenantStatus.ACTIVE, org.springframework.data.domain.Pageable.unpaged())
                .getContent().stream()
                .map(t -> t.getSecurityDeposit() != null ? t.getSecurityDeposit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public long getActiveTenantsCount(Long ownerId) {
        return tenantRepository.countByOwnerIdAndStatus(ownerId, TenantStatus.ACTIVE);
    }

    private TenantInfo mapToInfo(Tenant t) {
        TenantInfo info = new TenantInfo();
        info.setId(t.getId());
        info.setOwnerId(t.getOwnerId());
        info.setFullName(t.getFullName());
        info.setEmail(t.getEmail());
        info.setRoomId(t.getRoomId());
        info.setRoomNumber(t.getRoomNumber());
        info.setMonthlyRent(t.getMonthlyRent());
        info.setSecurityDeposit(t.getSecurityDeposit());
        info.setRentDueDay(t.getRentDueDay());
        info.setStatus(t.getStatus() != null ? t.getStatus().name() : null);
        return info;
    }

    @Data
    public static class TenantInfo {
        private Long       id;
        private Long       ownerId;
        private String     fullName;
        private String     email;
        private Long       roomId;
        private String     roomNumber;
        private BigDecimal monthlyRent;
        private BigDecimal securityDeposit;
        private Integer    rentDueDay;
        private String     status;
    }
}




