package com.pgmanager.room.service;
import com.pgmanager.common.enums.RoomStatus;
import com.pgmanager.room.client.TenantServiceClient;
import com.pgmanager.room.context.UserContext;
import com.pgmanager.room.dto.*;
import com.pgmanager.room.entity.Room;
import com.pgmanager.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
@Service @RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final TenantServiceClient tenantClient;
    private final com.pgmanager.room.client.AuthServiceClient authClient;
    
    @Override
    public RoomResponse createRoom(RoomRequest req) {
        Long userId = UserContext.getUserId();
        String userEmail = UserContext.getUserEmail();
        if (roomRepository.existsByUserIdAndRoomNumber(userId, req.getRoomNumber())) {
            throw new RuntimeException("Room number already exists: " + req.getRoomNumber());
        }
        if (req.getStatus() == RoomStatus.OCCUPIED) {
            throw new RuntimeException("A new room cannot be created with OCCUPIED status.");
        }
        Room room = Room.builder()
                .userId(userId)
                .roomNumber(req.getRoomNumber())
                .floor(req.getFloor())
                .roomType(req.getRoomType())
                .maxCapacity(req.getMaxCapacity())
                .rentAmount(req.getRentAmount())
                .amenities(req.getAmenities())
                .status(req.getStatus())
                .build();
        RoomResponse response = toResponse(roomRepository.save(room));
        
        authClient.logEvent(userId, userEmail, "ROOM_ADDED", "Room " + room.getRoomNumber() + " added");
        
        return response;
    }

    @Override
    public List<RoomResponse> getAllRooms(RoomStatus status, String search) {
        Long userId = UserContext.getUserId();
        List<Room> rooms;
        boolean hasStatus = status != null;
        boolean hasSearch = search != null && !search.isBlank();

        if (hasStatus && hasSearch) {
            rooms = roomRepository.findByUserIdAndStatusAndRoomNumberContainingIgnoreCase(userId, status, search);
        } else if (hasStatus) {
            rooms = roomRepository.findByUserIdAndStatus(userId, status);
        } else if (hasSearch) {
            rooms = roomRepository.findByUserIdAndRoomNumberContainingIgnoreCase(userId, search);
        } else {
            rooms = roomRepository.findByUserId(userId);
        }
        return rooms.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public RoomResponse getRoomById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    public RoomResponse updateRoom(Long id, RoomRequest req) {
        Long userId = UserContext.getUserId();
        Room room = findById(id);
        // If room number changed, check no duplicate for this user
        if (!room.getRoomNumber().equals(req.getRoomNumber()) &&
                roomRepository.existsByUserIdAndRoomNumber(userId, req.getRoomNumber())) {
            throw new RuntimeException("Room number already exists: " + req.getRoomNumber());
        }

        // Validation: Cannot manually set to OCCUPIED if not already occupied
        if (req.getStatus() == RoomStatus.OCCUPIED && room.getStatus() != RoomStatus.OCCUPIED) {
            throw new RuntimeException("Room status cannot be manually set to OCCUPIED. It is automatically set when tenants are assigned.");
        }

        // Validation: Cannot change status from OCCUPIED if tenants are still present
        if (room.getStatus() == RoomStatus.OCCUPIED && req.getStatus() != RoomStatus.OCCUPIED && room.getOccupancy() > 0) {
            throw new RuntimeException("Cannot change status from OCCUPIED while tenants are still in the room.");
        }
        
        // Validation: Cannot change status to MAINTENANCE if tenants are still present
        if (req.getStatus() == RoomStatus.MAINTENANCE && room.getOccupancy() > 0) {
            throw new RuntimeException("Cannot put room under MAINTENANCE while tenants are still present.");
        }

        room.setRoomNumber(req.getRoomNumber());
        room.setFloor(req.getFloor());
        room.setRoomType(req.getRoomType());
        room.setMaxCapacity(req.getMaxCapacity());
        room.setRentAmount(req.getRentAmount());
        room.setAmenities(req.getAmenities());
        room.setStatus(req.getStatus());
        return toResponse(roomRepository.save(room));
    }

    @Override
    public void deleteRoom(Long id) {
        Room room = findById(id);
        if (room.getStatus() == RoomStatus.OCCUPIED) {
            throw new RuntimeException("Cannot delete an OCCUPIED room.");
        }
        if (room.getOccupancy() > 0) {
            throw new RuntimeException("Cannot delete room — tenants still assigned.");
        }
        if (tenantClient.hasActiveTenantsByRoomNumber(room.getRoomNumber())) {
            throw new RuntimeException("Cannot delete Room " + room.getRoomNumber() + " — active tenants are assigned to it.");
        }
        roomRepository.delete(room);
    }

    @Override
    public List<RoomResponse> getAvailableRooms() {
        Long userId = UserContext.getUserId();
        return roomRepository
                .findByUserIdAndStatusOrderByRoomNumberAsc(userId, RoomStatus.AVAILABLE)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public RoomResponse updateStatus(Long id, RoomStatus status) {
        Room room = findById(id);
        room.setStatus(status);
        return toResponse(roomRepository.save(room));
    }

    @Override
    public RoomStatsResponse getStats() {
        Long userId = UserContext.getUserId();
        long total       = roomRepository.findByUserId(userId).size();
        long occupied    = roomRepository.countByUserIdAndStatus(userId, RoomStatus.OCCUPIED);
        long available   = roomRepository.countByUserIdAndStatus(userId, RoomStatus.AVAILABLE);
        long maintenance = roomRepository.countByUserIdAndStatus(userId, RoomStatus.MAINTENANCE);
        long floors      = roomRepository.countDistinctFloorByUserId(userId);
        
        double rate      = total > 0 ? Math.round((occupied * 100.0 / total) * 10.0) / 10.0 : 0.0;
        
        return RoomStatsResponse.builder()
                .totalRooms(total)
                .occupied(occupied)
                .available(available)
                .maintenance(maintenance)
                .floorCount(floors)
                .occupancyRate(rate)
                .build();
    }

    // ── private helpers ────────────────────────────
    private Room findById(Long id) {
        Long userId = UserContext.getUserId();
        return roomRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Room not found or access denied: " + id));
    }

    private RoomResponse toResponse(Room r) {
        return RoomResponse.builder()
                .id(r.getId())
                .roomNumber(r.getRoomNumber())
                .floor(r.getFloor())
                .roomType(r.getRoomType())
                .maxCapacity(r.getMaxCapacity())
                .occupancy(r.getOccupancy())
                .rentAmount(r.getRentAmount())
                .amenities(r.getAmenities())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
    @Override
    public RoomResponse incrementOccupancy(Long id) {
        // Inter-service calls might not have UserContext if called directly, 
        // but GatewayHeaderFilter should set it if called via Gateway.
        // If called service-to-service, X-User-Id should still be passed.
        Room room = findById(id);
        int newOccupancy = room.getOccupancy() + 1;
        if (newOccupancy > room.getMaxCapacity()) {
            throw new RuntimeException("Room " + room.getRoomNumber() + " is already full.");
        }
        room.setOccupancy(newOccupancy);
        // Only mark OCCUPIED when full
        if (newOccupancy >= room.getMaxCapacity()) {
            room.setStatus(RoomStatus.OCCUPIED);
        } else {
            room.setStatus(RoomStatus.AVAILABLE); // partially filled = still available
        }
        return toResponse(roomRepository.save(room));
    }

    @Override
    public RoomResponse decrementOccupancy(Long id) {
        Room room = findById(id);
        int newOccupancy = Math.max(0, room.getOccupancy() - 1);
        room.setOccupancy(newOccupancy);
        if (newOccupancy == 0) {
            room.setStatus(RoomStatus.AVAILABLE);  // completely empty
        } else if (newOccupancy < room.getMaxCapacity()) {
            room.setStatus(RoomStatus.AVAILABLE);  // partially filled = still available
        } else {
            room.setStatus(RoomStatus.OCCUPIED);   // still full
        }
        return toResponse(roomRepository.save(room));
    }

    @Override
    public boolean existsByRoomNumber(String roomNumber) {
        Long userId = UserContext.getUserId();
        return roomRepository.existsByUserIdAndRoomNumber(userId, roomNumber);
    }
}
