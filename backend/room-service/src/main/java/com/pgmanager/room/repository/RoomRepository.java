package com.pgmanager.room.repository;
import com.pgmanager.room.entity.Room;
import com.pgmanager.room.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    // Used by filter tabs: ALL / AVAILABLE / OCCUPIED / MAINTENANCE
    List<Room> findByStatus(RoomStatus status);

    // Used by search box in room table
    List<Room> findByRoomNumberContainingIgnoreCase(String roomNumber);

    // Used by status filter + search combined
    List<Room> findByStatusAndRoomNumberContainingIgnoreCase(
            RoomStatus status, String roomNumber);

    // Prevent duplicate room numbers
    boolean existsByRoomNumber(String roomNumber);

    // Used by tenant-service to find available rooms for assignment
    List<Room> findByStatusOrderByRoomNumberAsc(RoomStatus status);

    // Used by dashboard stats
    long countByStatus(RoomStatus status);
}
