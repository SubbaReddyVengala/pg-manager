package com.pgmanager.api.maintenance.client;

import com.pgmanager.api.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component("maintenanceRoomServiceClient")
@RequiredArgsConstructor
@Slf4j
public class RoomServiceClient {

    private final RoomService roomService;

    public boolean roomExists(String roomNumber) {
        try {
            return roomService.existsByRoomNumber(roomNumber);
        } catch (Exception e) {
            log.error("Error checking room existence for {}: {}", roomNumber, e.getMessage());
            return false;
        }
    }
}
