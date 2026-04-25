package com.pgmanager.tenant.service;
import com.pgmanager.tenant.dto.*;
import com.pgmanager.tenant.enums.TenantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface TenantService {
    TenantResponse        createTenant(TenantRequest request);
    Page<TenantResponse>  getAllTenants(TenantStatus status, String search, Pageable pageable);
    TenantDetailResponse  getTenantById(Long id);
    TenantResponse        updateTenant(Long id, TenantRequest request);
    void                  deleteTenant(Long id);
    TenantResponse        assignRoom(Long id, AssignRoomRequest request);
    TenantResponse        moveOut(Long id, MoveOutRequest request);
    TenantStatsResponse   getStats();
    List<TenantResponse>  getTenantsByRoom(Long roomId);
}
