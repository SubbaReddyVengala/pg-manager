package com.pgmanager.room.service;
import com.pgmanager.common.enums.RoomStatus;
import com.pgmanager.room.dto.*;
import java.util.List;

public interface RoomService {
    RoomResponse        createRoom(RoomRequest request);
    List<RoomResponse>  getAllRooms(RoomStatus status, String search);
    RoomResponse        getRoomById(Long id);
    RoomResponse        updateRoom(Long id, RoomRequest request);
    void                deleteRoom(Long id);
    List<RoomResponse>  getAvailableRooms();
    RoomResponse        updateStatus(Long id, RoomStatus status);
    RoomStatsResponse   getStats();
    RoomResponse incrementOccupancy(Long id);
    RoomResponse decrementOccupancy(Long id);
    boolean existsByRoomNumber(String roomNumber);
}
