package com.pgmanager.api.room.client;

import com.pgmanager.common.enums.TenantStatus;
import com.pgmanager.api.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component("roomTenantServiceClient")
@RequiredArgsConstructor
@Slf4j
public class TenantServiceClient {

    private final TenantRepository tenantRepository;

    public boolean hasActiveTenantsByRoomNumber(String roomNumber) {
        try {
            return tenantRepository.findAll().stream()
                    .anyMatch(t -> t.getStatus() == TenantStatus.ACTIVE && roomNumber.equals(t.getRoomNumber()));
        } catch (Exception e) {
            log.error("Error checking active tenants for room {}: {}", roomNumber, e.getMessage());
            return false;
        }
    }
}




