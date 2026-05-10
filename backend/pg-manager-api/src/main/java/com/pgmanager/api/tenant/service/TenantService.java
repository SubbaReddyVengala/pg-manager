package com.pgmanager.api.tenant.service;
import com.pgmanager.api.tenant.dto.*;
import com.pgmanager.common.enums.TenantStatus;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TenantService {
    TenantResponse         createTenant(TenantRequest request);
    Page<TenantResponse>   getAllTenants(TenantStatus status, String search, Pageable pageable);
    TenantDetailResponse   getTenantById(Long id);
    TenantResponse        updateTenant(Long id, TenantRequest request);
    void                  deleteTenant(Long id);
    TenantResponse        assignRoom(Long id, AssignRoomRequest request);
    TenantResponse        moveOut(Long id, MoveOutRequest request);
    TenantStatsResponse   getStats();
    long                  countActiveInMonth(Long ownerId, java.time.LocalDate start, java.time.LocalDate end);
    List<TenantResponse>  getTenantsByRoom(Long roomId);
    byte[]                generateAgreement(Long id);
    long                  countAllTenantsIgnoreOwner();
}




