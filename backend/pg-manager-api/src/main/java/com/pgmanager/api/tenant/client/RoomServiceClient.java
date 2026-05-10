package com.pgmanager.api.tenant.client;

import com.pgmanager.api.room.dto.RoomResponse;
import com.pgmanager.common.enums.RoomStatus;
import com.pgmanager.api.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component("tenantRoomServiceClient")
@RequiredArgsConstructor
@Slf4j
public class RoomServiceClient {

    private final RoomService roomService;

    // Called when assigning room to tenant
    public void markOccupied(Long roomId) {
        roomService.updateStatus(roomId, RoomStatus.OCCUPIED);
    }

    // Called when tenant moves out
    public void markAvailable(Long roomId) {
        roomService.updateStatus(roomId, RoomStatus.AVAILABLE);
    }

    // Gets room number by id -- used when assigning room
    public String getRoomNumber(Long roomId) {
        try {
            RoomResponse room = roomService.getRoomById(roomId);
            return room != null ? room.getRoomNumber() : null;
        } catch (Exception e) {
            log.error("Error fetching room number for id {}: {}", roomId, e.getMessage());
            return null;
        }
    }

    public void incrementOccupancy(Long roomId) {
        roomService.incrementOccupancy(roomId);
    }

    public void decrementOccupancy(Long roomId) {
        roomService.decrementOccupancy(roomId);
    }
}




