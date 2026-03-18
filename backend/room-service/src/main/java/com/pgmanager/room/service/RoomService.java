package com.pgmanager.room.service;
import com.pgmanager.room.dto.*;
import com.pgmanager.room.enums.RoomStatus;
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
}
