package com.pgmanager.room.controller;
import com.pgmanager.room.dto.*;
import com.pgmanager.room.enums.RoomStatus;
import com.pgmanager.room.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    // GET /rooms?status=AVAILABLE&search=101
    // Supports: ALL rooms, filter by status, search by room number
    @GetMapping
    public ResponseEntity<List<RoomResponse>> getAll(
            @RequestParam(required = false) RoomStatus status,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(roomService.getAllRooms(status, search));
    }

    // GET /rooms/{id}
    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    // GET /rooms/available  (used by tenant-service for room assignment)
    @GetMapping("/available")
    public ResponseEntity<List<RoomResponse>> getAvailable() {
        return ResponseEntity.ok(roomService.getAvailableRooms());
    }

    // GET /rooms/stats  (used by dashboard)
    @GetMapping("/stats")
    public ResponseEntity<RoomStatsResponse> getStats() {
        return ResponseEntity.ok(roomService.getStats());
    }

    // POST /rooms  (Add New Room)
    @PostMapping
    public ResponseEntity<RoomResponse> create(
            @Valid @RequestBody RoomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roomService.createRoom(request));
    }

    // PUT /rooms/{id}  (Edit Room)
    @PutMapping("/{id}")
    public ResponseEntity<RoomResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RoomRequest request) {
        return ResponseEntity.ok(roomService.updateRoom(id, request));
    }

    // PATCH /rooms/{id}/status  (called internally by tenant-service)
    @PatchMapping("/{id}/status")
    public ResponseEntity<RoomResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam RoomStatus status) {
        return ResponseEntity.ok(roomService.updateStatus(id, status));
    }

    // DELETE /rooms/{id}  (cannot delete OCCUPIED rooms)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}

