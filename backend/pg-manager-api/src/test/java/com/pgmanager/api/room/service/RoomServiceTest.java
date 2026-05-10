package com.pgmanager.api.room.service;

import com.pgmanager.api.auth.entity.OwnerProfile;
import com.pgmanager.api.auth.repository.OwnerProfileRepository;
import com.pgmanager.api.auth.repository.UserActivityRepository;
import com.pgmanager.common.util.SecurityUtils;
import com.pgmanager.api.room.client.TenantServiceClient;
import com.pgmanager.api.room.dto.RoomRequest;
import com.pgmanager.api.room.dto.RoomResponse;
import com.pgmanager.api.room.entity.Room;
import com.pgmanager.common.enums.RoomStatus;
import com.pgmanager.common.enums.RoomType;
import com.pgmanager.api.room.repository.RoomRepository;
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
public class RoomServiceTest {

    @Mock private RoomRepository roomRepository;
    @Mock private TenantServiceClient tenantClient;
    @Mock private OwnerProfileRepository ownerProfileRepository;
    @Mock private UserActivityRepository userActivityRepository;

    @InjectMocks
    private RoomServiceImpl roomService;

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
    void createRoom_Success() {
        // Given
        RoomRequest request = new RoomRequest();
        request.setRoomNumber("101");
        request.setFloor(1);
        request.setRoomType(RoomType.SINGLE);
        request.setMaxCapacity(1);
        request.setRentAmount(new BigDecimal("5000"));
        request.setStatus(RoomStatus.AVAILABLE);

        OwnerProfile profile = OwnerProfile.builder().maxRooms(10).build();
        when(ownerProfileRepository.findByUserId(ownerId)).thenReturn(Optional.of(profile));
        when(roomRepository.countByOwnerId(ownerId)).thenReturn(5L);
        when(roomRepository.existsByOwnerIdAndRoomNumber(ownerId, "101")).thenReturn(false);
        
        Room savedRoom = Room.builder()
                .id(100L)
                .ownerId(ownerId)
                .roomNumber("101")
                .status(RoomStatus.AVAILABLE)
                .build();
        when(roomRepository.save(any())).thenReturn(savedRoom);

        // When
        RoomResponse response = roomService.createRoom(request);

        // Then
        assertNotNull(response);
        assertEquals("101", response.getRoomNumber());
        verify(roomRepository).save(any());
    }

    @Test
    void createRoom_LimitReached_ThrowsException() {
        // Given
        RoomRequest request = new RoomRequest();
        OwnerProfile profile = OwnerProfile.builder().maxRooms(5).build();
        when(ownerProfileRepository.findByUserId(ownerId)).thenReturn(Optional.of(profile));
        when(roomRepository.countByOwnerId(ownerId)).thenReturn(5L);

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            roomService.createRoom(request);
        });
        assertTrue(exception.getMessage().contains("limit reached"));
    }
}
