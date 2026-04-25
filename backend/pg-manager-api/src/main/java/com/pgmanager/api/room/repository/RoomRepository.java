package com.pgmanager.api.room.repository;
import com.pgmanager.api.room.entity.Room;
import com.pgmanager.api.room.enums.RoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    // Used by filter tabs: ALL / AVAILABLE / OCCUPIED / MAINTENANCE
    Page<Room> findByStatus(RoomStatus status, Pageable pageable);

    // Used by search box in room table
    Page<Room> findByRoomNumberContainingIgnoreCase(String roomNumber, Pageable pageable);

    // Used by status filter + search combined
    Page<Room> findByStatusAndRoomNumberContainingIgnoreCase(
            RoomStatus status, String roomNumber, Pageable pageable);

    // Prevent duplicate room numbers
    boolean existsByRoomNumber(String roomNumber);

    // Used by tenant-service to find available rooms for assignment
    List<Room> findByStatusOrderByRoomNumberAsc(RoomStatus status);

    // Used by dashboard stats
    long countByStatus(RoomStatus status);

    @Query("SELECT COUNT(DISTINCT r.floor) FROM Room r")
    long countDistinctFloor();
}
