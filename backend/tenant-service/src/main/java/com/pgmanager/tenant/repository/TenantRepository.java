package com.pgmanager.tenant.repository;
import com.pgmanager.tenant.entity.Tenant;
import com.pgmanager.common.enums.TenantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    // Filter tabs: ALL / ACTIVE / PENDING / INACTIVE
    Page<Tenant> findByUserIdAndStatus(Long userId, TenantStatus status, Pageable pageable);

    Page<Tenant> findByUserId(Long userId, Pageable pageable);

    // Search by name, phone, or room number
    @Query("""
        SELECT t FROM Tenant t WHERE t.userId = :userId AND (
        LOWER(t.fullName)    LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.phone)       LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.roomNumber)  LIKE LOWER(CONCAT('%',:q,'%')))
    """)
    Page<Tenant> search(@Param("userId") Long userId, @Param("q") String query, Pageable pageable);

    // Search + filter combined
    @Query("""
        SELECT t FROM Tenant t WHERE t.userId = :userId AND t.status = :status AND (
        LOWER(t.fullName)    LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.phone)       LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.roomNumber)  LIKE LOWER(CONCAT('%',:q,'%')))
    """)
    Page<Tenant> searchByStatus(@Param("userId") Long userId, @Param("status") TenantStatus status, @Param("q") String q, Pageable pageable);

    // Stats cards
    long countByUserIdAndStatus(Long userId, TenantStatus status);

    // "MOVE-OUTS THIS MONTH" stat card
    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.userId = :userId AND t.moveOutDate >= :start AND t.moveOutDate <= :end")
    long countMoveOutsBetween(@Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    // Check if email already registered
    boolean existsByEmail(String email);

    // Check if room already has an active tenant
    Optional<Tenant> findByRoomIdAndStatus(Long roomId, TenantStatus status);

    // Get all tenants for a room
    List<Tenant> findByRoomIdAndStatusIn(Long roomId, List<TenantStatus> statuses);

    Optional<Tenant> findByIdAndUserId(Long id, Long userId);
}

