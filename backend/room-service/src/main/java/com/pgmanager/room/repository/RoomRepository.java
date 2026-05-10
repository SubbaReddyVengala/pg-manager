package com.pgmanager.room.repository;
import com.pgmanager.room.entity.Room;
import com.pgmanager.common.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    // Used by filter tabs: ALL / AVAILABLE / OCCUPIED / MAINTENANCE
    List<Room> findByUserIdAndStatus(Long userId, RoomStatus status);

    List<Room> findByUserId(Long userId);

    // Used by search box in room table
    List<Room> findByUserIdAndRoomNumberContainingIgnoreCase(Long userId, String roomNumber);

    // Used by status filter + search combined
    List<Room> findByUserIdAndStatusAndRoomNumberContainingIgnoreCase(
            Long userId, RoomStatus status, String roomNumber);

    // Prevent duplicate room numbers per user
    boolean existsByUserIdAndRoomNumber(Long userId, String roomNumber);

    // Used by tenant-service to find available rooms for assignment
    List<Room> findByUserIdAndStatusOrderByRoomNumberAsc(Long userId, RoomStatus status);

    // Used by dashboard stats
    long countByUserIdAndStatus(Long userId, RoomStatus status);

    @Query("SELECT COUNT(DISTINCT r.floor) FROM Room r WHERE r.userId = :userId")
    long countDistinctFloorByUserId(@Param("userId") Long userId);

    Optional<Room> findByIdAndUserId(Long id, Long userId);
}
