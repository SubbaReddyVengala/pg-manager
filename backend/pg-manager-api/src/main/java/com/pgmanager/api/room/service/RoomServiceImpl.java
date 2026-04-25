package com.pgmanager.api.room.service;
import com.pgmanager.api.room.client.TenantServiceClient;
import com.pgmanager.api.room.dto.*;
import com.pgmanager.api.room.entity.Room;
import com.pgmanager.api.room.enums.RoomStatus;
import com.pgmanager.api.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;
@Service @RequiredArgsConstructor @Slf4j
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final TenantServiceClient tenantClient;

    @Override
    public RoomResponse createRoom(RoomRequest req) {
        log.info("Attempting to create room: {}", req.getRoomNumber());
        try {
            if (roomRepository.existsByRoomNumber(req.getRoomNumber())) {
                log.warn("Room number already exists: {}", req.getRoomNumber());
                throw new RuntimeException("Room number already exists: " + req.getRoomNumber());
            }
            if (req.getStatus() == RoomStatus.OCCUPIED) {
                log.warn("Cannot create new room with OCCUPIED status");
                throw new RuntimeException("A new room cannot be created with OCCUPIED status.");
            }
            Room room = Room.builder()
                    .roomNumber(req.getRoomNumber())
                    .floor(req.getFloor())
                    .roomType(req.getRoomType())
                    .maxCapacity(req.getMaxCapacity())
                    .rentAmount(req.getRentAmount())
                    .amenities(req.getAmenities())
                    .status(req.getStatus())
                    .build();
            
            Room savedRoom = roomRepository.save(room);
            log.info("Successfully saved room: {} with id: {}", savedRoom.getRoomNumber(), savedRoom.getId());
            return toResponse(savedRoom);
        } catch (Exception e) {
            log.error("Error creating room {}: {}", req.getRoomNumber(), e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public Page<RoomResponse> getAllRooms(RoomStatus status, String search, Pageable pageable) {
        Page<Room> rooms;
        boolean hasStatus = status != null;
        boolean hasSearch = search != null && !search.isBlank();

        if (hasStatus && hasSearch) {
            rooms = roomRepository.findByStatusAndRoomNumberContainingIgnoreCase(status, search, pageable);
        } else if (hasStatus) {
            rooms = roomRepository.findByStatus(status, pageable);
        } else if (hasSearch) {
            rooms = roomRepository.findByRoomNumberContainingIgnoreCase(search, pageable);
        } else {
            rooms = roomRepository.findAll(pageable);
        }
        return rooms.map(this::toResponse);
    }

    @Override
    public RoomResponse getRoomById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    public RoomResponse updateRoom(Long id, RoomRequest req) {
        Room room = findById(id);
        // If room number changed, check no duplicate
        if (!room.getRoomNumber().equals(req.getRoomNumber()) &&
                roomRepository.existsByRoomNumber(req.getRoomNumber())) {
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
        return roomRepository
                .findByStatusOrderByRoomNumberAsc(RoomStatus.AVAILABLE)
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
        long total       = roomRepository.count();
        long occupied    = roomRepository.countByStatus(RoomStatus.OCCUPIED);
        long available   = roomRepository.countByStatus(RoomStatus.AVAILABLE);
        long maintenance = roomRepository.countByStatus(RoomStatus.MAINTENANCE);
        long floors      = roomRepository.countDistinctFloor();
        
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
        return roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found with id: " + id));
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
        return roomRepository.existsByRoomNumber(roomNumber);
    }
}
