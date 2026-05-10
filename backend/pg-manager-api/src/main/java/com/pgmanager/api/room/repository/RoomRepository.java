package com.pgmanager.api.room.repository;
import com.pgmanager.api.room.entity.Room;
import com.pgmanager.common.enums.RoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    // Used by filter tabs: ALL / AVAILABLE / OCCUPIED / MAINTENANCE
    Page<Room> findByOwnerIdAndStatus(Long ownerId, RoomStatus status, Pageable pageable);

    // Used by search box in room table
    Page<Room> findByOwnerIdAndRoomNumberContainingIgnoreCase(Long ownerId, String roomNumber, Pageable pageable);

    // Used by status filter + search combined
    Page<Room> findByOwnerIdAndStatusAndRoomNumberContainingIgnoreCase(
            Long ownerId, RoomStatus status, String roomNumber, Pageable pageable);

    Page<Room> findAllByOwnerId(Long ownerId, Pageable pageable);

    // Prevent duplicate room numbers per owner
    boolean existsByOwnerIdAndRoomNumber(Long ownerId, String roomNumber);

    // Used by tenant-service to find available rooms for assignment
    List<Room> findByOwnerIdAndStatusOrderByRoomNumberAsc(Long ownerId, RoomStatus status);

    // Used by dashboard stats
    long countByOwnerIdAndStatus(Long ownerId, RoomStatus status);

    @Query("SELECT COUNT(DISTINCT r.floor) FROM Room r WHERE r.ownerId = :ownerId")
    long countDistinctFloorByOwnerId(@Param("ownerId") Long ownerId);
    
    long countByOwnerId(Long ownerId);

    void deleteAllByOwnerId(Long ownerId);
}




