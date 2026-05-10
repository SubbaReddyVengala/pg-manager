package com.pgmanager.api.tenant.repository;
import com.pgmanager.api.tenant.entity.Tenant;
import com.pgmanager.common.enums.TenantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    // Filter tabs: ALL / ACTIVE / PENDING / INACTIVE
    Page<Tenant> findByOwnerIdAndStatus(Long ownerId, TenantStatus status, Pageable pageable);

    // Search by name, phone, or room number
    @Query("""
        SELECT t FROM Tenant t WHERE t.ownerId = :ownerId AND (
        LOWER(t.fullName)    LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.phone)       LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.roomNumber)  LIKE LOWER(CONCAT('%',:q,'%')))
    """)
    Page<Tenant> searchByOwner(@Param("ownerId") Long ownerId, @Param("q") String query, Pageable pageable);

    // Search + filter combined
    @Query("""
        SELECT t FROM Tenant t WHERE t.ownerId = :ownerId AND t.status = :status AND (
        LOWER(t.fullName)    LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.phone)       LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.roomNumber)  LIKE LOWER(CONCAT('%',:q,'%')))
    """)
    Page<Tenant> searchByStatusAndOwner(@Param("ownerId") Long ownerId, @Param("status") TenantStatus status, @Param("q") String q, Pageable pageable);

    Page<Tenant> findAllByOwnerId(Long ownerId, Pageable pageable);

    // Stats cards
    long countByOwnerIdAndStatus(Long ownerId, TenantStatus status);
    long countByStatus(TenantStatus status);

    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.ownerId = :ownerId AND t.status = :status")
    long countByOwnerIdAndStatusQuery(@Param("ownerId") Long ownerId, @Param("status") TenantStatus status);

    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.ownerId = :ownerId AND t.moveInDate <= :end AND (t.moveOutDate IS NULL OR t.moveOutDate >= :start)")
    long countActiveInMonthByOwner(@Param("ownerId") Long ownerId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.ownerId = :ownerId AND t.moveOutDate >= :start AND t.moveOutDate <= :end")
    long countMoveOutsBetweenByOwner(@Param("ownerId") Long ownerId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    // Get all tenants for a room (Owner-specific)
    List<Tenant> findByOwnerIdAndRoomIdAndStatusIn(Long ownerId, Long roomId, List<TenantStatus> statuses);

    // Check if email already registered per owner
    boolean existsByOwnerIdAndEmail(Long ownerId, String email);

    // Check if room already has an active tenant for this owner
    Optional<Tenant> findByOwnerIdAndRoomIdAndStatus(Long ownerId, Long roomId, TenantStatus status);

    void deleteAllByOwnerId(Long ownerId);
}




