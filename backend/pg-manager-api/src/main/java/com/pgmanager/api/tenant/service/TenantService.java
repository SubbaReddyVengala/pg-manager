package com.pgmanager.api.tenant.service;
import com.pgmanager.api.tenant.dto.*;
import com.pgmanager.api.tenant.enums.TenantStatus;
import java.util.List;

public interface TenantService {
    TenantResponse        createTenant(TenantRequest request);
    List<TenantResponse>  getAllTenants(TenantStatus status, String search);
    TenantDetailResponse  getTenantById(Long id);
    TenantResponse        updateTenant(Long id, TenantRequest request);
    void                  deleteTenant(Long id);
    TenantResponse        assignRoom(Long id, AssignRoomRequest request);
    TenantResponse        moveOut(Long id, MoveOutRequest request);
    TenantStatsResponse   getStats();
    List<TenantResponse>  getTenantsByRoom(Long roomId);
}
