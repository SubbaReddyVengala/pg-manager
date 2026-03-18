package com.pgmanager.room.service;
import com.pgmanager.room.dto.*;
import com.pgmanager.room.entity.Room;
import com.pgmanager.room.enums.RoomStatus;
import com.pgmanager.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;

    @Override
    public RoomResponse createRoom(RoomRequest req) {
        if (roomRepository.existsByRoomNumber(req.getRoomNumber())) {
            throw new RuntimeException("Room number already exists: " + req.getRoomNumber());
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
        return toResponse(roomRepository.save(room));
    }

    @Override
    public List<RoomResponse> getAllRooms(RoomStatus status, String search) {
        List<Room> rooms;
        boolean hasStatus = status != null;
        boolean hasSearch = search != null && !search.isBlank();

        if (hasStatus && hasSearch) {
            rooms = roomRepository.findByStatusAndRoomNumberContainingIgnoreCase(status, search);
        } else if (hasStatus) {
            rooms = roomRepository.findByStatus(status);
        } else if (hasSearch) {
            rooms = roomRepository.findByRoomNumberContainingIgnoreCase(search);
        } else {
            rooms = roomRepository.findAll();
        }
        return rooms.stream().map(this::toResponse).collect(Collectors.toList());
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
            throw new RuntimeException("Cannot delete an OCCUPIED room. Move out tenant first.");
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
        double rate      = total > 0 ? Math.round((occupied * 100.0 / total) * 10.0) / 10.0 : 0.0;
        return RoomStatsResponse.builder()
                .totalRooms(total)
                .occupied(occupied)
                .available(available)
                .maintenance(maintenance)
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
}
