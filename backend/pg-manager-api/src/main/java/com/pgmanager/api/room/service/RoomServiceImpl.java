package com.pgmanager.api.room.service;
import com.pgmanager.common.util.SecurityUtils;
import com.pgmanager.api.room.client.TenantServiceClient;
import com.pgmanager.api.room.dto.*;
import com.pgmanager.api.room.entity.Room;
import com.pgmanager.common.enums.RoomStatus;
import com.pgmanager.api.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Slf4j
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final TenantServiceClient tenantClient;
    private final com.pgmanager.api.auth.repository.OwnerProfileRepository ownerProfileRepository;
    private final com.pgmanager.api.auth.repository.UserActivityRepository userActivityRepository;

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardStats", key = "T(com.pgmanager.common.util.SecurityUtils).getCurrentOwnerId()")
    public RoomResponse createRoom(RoomRequest req) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        log.info("Attempting to create room: {} for owner: {}", req.getRoomNumber(), ownerId);

        // Enforce limits
        com.pgmanager.api.auth.entity.OwnerProfile profile = ownerProfileRepository.findByUserId(ownerId)
                .orElse(com.pgmanager.api.auth.entity.OwnerProfile.builder().build());
        long currentRooms = roomRepository.countByOwnerId(ownerId);
        if (currentRooms >= profile.getMaxRooms()) {
            throw new RuntimeException("Room limit reached (" + profile.getMaxRooms() + "). Contact admin to upgrade.");
        }

        try {
            if (roomRepository.existsByOwnerIdAndRoomNumber(ownerId, req.getRoomNumber())) {
                log.warn("Room number already exists: {} for owner: {}", req.getRoomNumber(), ownerId);
                throw new RuntimeException("Room number already exists: " + req.getRoomNumber());
            }
            if (req.getStatus() == RoomStatus.OCCUPIED) {
                throw new RuntimeException("A new room cannot be created with OCCUPIED status.");
            }
            Room room = Room.builder()
                    .ownerId(ownerId)
                    .roomNumber(req.getRoomNumber())
                    .floor(req.getFloor())
                    .roomType(req.getRoomType())
                    .maxCapacity(req.getMaxCapacity())
                    .rentAmount(req.getRentAmount())
                    .amenities(req.getAmenities())
                    .status(req.getStatus())
                    .build();
            
            Room savedRoom = roomRepository.save(room);
            
            if (currentRooms == 0) {
                userActivityRepository.save(com.pgmanager.api.auth.entity.UserActivity.builder()
                        .userId(ownerId).ownerId(ownerId).actionType("ROOM_ADDED")
                        .description("First room added: " + savedRoom.getRoomNumber())
                        .timestamp(java.time.LocalDateTime.now()).build());
            }

            log.info("Successfully saved room: {} with id: {}", savedRoom.getRoomNumber(), savedRoom.getId());
            return toResponse(savedRoom);
        } catch (Exception e) {
            log.error("Error creating room: {}", e.getMessage());
            throw e;
        }
    }

    @Override
    public Page<RoomResponse> getAllRooms(RoomStatus status, String search, Pageable pageable) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        Page<Room> rooms;
        boolean hasStatus = status != null;
        boolean hasSearch = search != null && !search.isBlank();

        if (hasStatus && hasSearch) {
            rooms = roomRepository.findByOwnerIdAndStatusAndRoomNumberContainingIgnoreCase(ownerId, status, search, pageable);
        } else if (hasStatus) {
            rooms = roomRepository.findByOwnerIdAndStatus(ownerId, status, pageable);
        } else if (hasSearch) {
            rooms = roomRepository.findByOwnerIdAndRoomNumberContainingIgnoreCase(ownerId, search, pageable);
        } else {
            rooms = roomRepository.findAllByOwnerId(ownerId, pageable);
        }
        return rooms.map(this::toResponse);
    }

    @Override
    public RoomResponse getRoomById(Long id) {
        Room room = findById(id);
        validateOwner(room);
        return toResponse(room);
    }

    @Override
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardStats", key = "T(com.pgmanager.common.util.SecurityUtils).getCurrentOwnerId()")
    public RoomResponse updateRoom(Long id, RoomRequest req) {
        Room room = findById(id);
        validateOwner(room);
        Long ownerId = room.getOwnerId();

        if (!room.getRoomNumber().equals(req.getRoomNumber()) &&
                roomRepository.existsByOwnerIdAndRoomNumber(ownerId, req.getRoomNumber())) {
            throw new RuntimeException("Room number already exists: " + req.getRoomNumber());
        }

        if (req.getStatus() == RoomStatus.OCCUPIED && room.getStatus() != RoomStatus.OCCUPIED) {
            throw new RuntimeException("Room status cannot be manually set to OCCUPIED.");
        }

        if (room.getStatus() == RoomStatus.OCCUPIED && req.getStatus() != RoomStatus.OCCUPIED && room.getOccupancy() > 0) {
            throw new RuntimeException("Cannot change status from OCCUPIED while tenants are still in the room.");
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
    @Transactional
    @org.springframework.cache.annotation.CacheEvict(value = "dashboardStats", key = "T(com.pgmanager.common.util.SecurityUtils).getCurrentOwnerId()")
    public void deleteRoom(Long id) {
        Room room = findById(id);
        validateOwner(room);
        if (room.getStatus() == RoomStatus.OCCUPIED || room.getOccupancy() > 0) {
            throw new RuntimeException("Cannot delete room with active occupancy.");
        }
        roomRepository.delete(room);
    }

    @Override
    public List<RoomResponse> getAvailableRooms() {
        return roomRepository
                .findByOwnerIdAndStatusOrderByRoomNumberAsc(SecurityUtils.getCurrentOwnerId(), RoomStatus.AVAILABLE)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RoomResponse updateStatus(Long id, RoomStatus status) {
        Room room = findById(id);
        validateOwner(room);
        room.setStatus(status);
        return toResponse(roomRepository.save(room));
    }

    @Override
    public RoomStatsResponse getStats() {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        long total       = roomRepository.countByOwnerId(ownerId);
        long occupied    = roomRepository.countByOwnerIdAndStatus(ownerId, RoomStatus.OCCUPIED);
        long available   = roomRepository.countByOwnerIdAndStatus(ownerId, RoomStatus.AVAILABLE);
        long maintenance = roomRepository.countByOwnerIdAndStatus(ownerId, RoomStatus.MAINTENANCE);
        long floors      = roomRepository.countDistinctFloorByOwnerId(ownerId);
        
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

    @Override
    @Transactional
    public RoomResponse incrementOccupancy(Long id) {
        Room room = findById(id);
        validateOwner(room);
        int newOccupancy = room.getOccupancy() + 1;
        if (newOccupancy > room.getMaxCapacity()) {
            throw new RuntimeException("Room " + room.getRoomNumber() + " is already full.");
        }
        room.setOccupancy(newOccupancy);
        if (newOccupancy >= room.getMaxCapacity()) {
            room.setStatus(RoomStatus.OCCUPIED);
        }
        return toResponse(roomRepository.save(room));
    }

    @Override
    @Transactional
    public RoomResponse decrementOccupancy(Long id) {
        Room room = findById(id);
        validateOwner(room);
        int newOccupancy = Math.max(0, room.getOccupancy() - 1);
        room.setOccupancy(newOccupancy);
        if (newOccupancy < room.getMaxCapacity() && room.getStatus() == RoomStatus.OCCUPIED) {
            room.setStatus(RoomStatus.AVAILABLE);
        }
        return toResponse(roomRepository.save(room));
    }

    @Override
    public boolean existsByRoomNumber(String roomNumber) {
        return roomRepository.existsByOwnerIdAndRoomNumber(SecurityUtils.getCurrentOwnerId(), roomNumber);
    }

    @Override
    public long countAllRoomsIgnoreOwner() {
        return roomRepository.count();
    }

    // ── private helpers ────────────────────────────
    private Room findById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found: " + id));
    }

    private void validateOwner(Room room) {
        if (!room.getOwnerId().equals(SecurityUtils.getCurrentOwnerId())) {
            throw new RuntimeException("Unauthorized access to this room");
        }
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
}




