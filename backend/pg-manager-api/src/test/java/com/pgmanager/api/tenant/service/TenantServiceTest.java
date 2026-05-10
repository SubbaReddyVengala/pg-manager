package com.pgmanager.api.tenant.service;

import com.pgmanager.api.auth.entity.OwnerProfile;
import com.pgmanager.api.auth.repository.OwnerProfileRepository;
import com.pgmanager.api.auth.repository.UserActivityRepository;
import com.pgmanager.common.util.SecurityUtils;
import com.pgmanager.api.tenant.client.PaymentServiceClient;
import com.pgmanager.api.tenant.client.RoomServiceClient;
import com.pgmanager.api.tenant.dto.TenantRequest;
import com.pgmanager.api.tenant.dto.TenantResponse;
import com.pgmanager.api.tenant.entity.Tenant;
import com.pgmanager.common.enums.TenantStatus;
import com.pgmanager.api.tenant.repository.TenantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TenantServiceTest {

    @Mock private TenantRepository tenantRepository;
    @Mock private PaymentServiceClient paymentClient;
    @Mock private RoomServiceClient roomClient;
    @Mock private OwnerProfileRepository ownerProfileRepository;
    @Mock private UserActivityRepository userActivityRepository;

    @InjectMocks
    private TenantServiceImpl tenantService;

    private MockedStatic<SecurityUtils> securityUtils;
    private Long ownerId = 1L;

    @BeforeEach
    void setUp() {
        securityUtils = mockStatic(SecurityUtils.class);
        securityUtils.when(SecurityUtils::getCurrentOwnerId).thenReturn(ownerId);
    }

    @AfterEach
    void tearDown() {
        securityUtils.close();
    }

    @Test
    void createTenant_WithRoom_Success() {
        // Given
        TenantRequest request = new TenantRequest();
        request.setFullName("Ravi Kumar");
        request.setEmail("ravi@example.com");
        request.setPhone("9876543210");
        request.setRoomId(101L);
        request.setMonthlyRent(new BigDecimal("6000"));
        request.setRecordInitialPayment(true);

        OwnerProfile profile = OwnerProfile.builder().maxTenants(10).build();
        when(ownerProfileRepository.findByUserId(ownerId)).thenReturn(Optional.of(profile));
        when(tenantRepository.countByOwnerIdAndStatus(ownerId, TenantStatus.ACTIVE)).thenReturn(5L);
        when(tenantRepository.existsByOwnerIdAndEmail(ownerId, "ravi@example.com")).thenReturn(false);
        when(roomClient.getRoomNumber(101L)).thenReturn("R-101");

        Tenant savedTenant = Tenant.builder()
                .id(1L)
                .ownerId(ownerId)
                .fullName("Ravi Kumar")
                .status(TenantStatus.ACTIVE)
                .monthlyRent(new BigDecimal("6000"))
                .build();
        when(tenantRepository.save(any())).thenReturn(savedTenant);

        // When
        TenantResponse response = tenantService.createTenant(request);

        // Then
        assertNotNull(response);
        assertEquals(TenantStatus.ACTIVE, response.getStatus());
        verify(roomClient).incrementOccupancy(101L);
        verify(paymentClient).recordInitialPayment(eq(1L), any(), any());
    }

    @Test
    void createTenant_LimitReached_ThrowsException() {
        // Given
        TenantRequest request = new TenantRequest();
        request.setRoomId(101L);
        OwnerProfile profile = OwnerProfile.builder().maxTenants(5).build();
        when(ownerProfileRepository.findByUserId(ownerId)).thenReturn(Optional.of(profile));
        when(tenantRepository.countByOwnerIdAndStatus(ownerId, TenantStatus.ACTIVE)).thenReturn(5L);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            tenantService.createTenant(request);
        });
        assertTrue(exception.getMessage().contains("tenant limit reached"));
    }
}
