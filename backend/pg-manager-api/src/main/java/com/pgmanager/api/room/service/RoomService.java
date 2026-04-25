package com.pgmanager.api.room.service;
import com.pgmanager.api.room.dto.*;
import com.pgmanager.api.room.enums.RoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface RoomService {
    RoomResponse          createRoom(RoomRequest request);
    Page<RoomResponse>    getAllRooms(RoomStatus status, String search, Pageable pageable);

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
