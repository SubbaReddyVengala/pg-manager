package com.pgmanager.tenant.repository;
import com.pgmanager.tenant.entity.Tenant;
import com.pgmanager.tenant.enums.TenantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TenantRepository extends JpaRepository<Tenant, Long> {

    // Filter tabs: ALL / ACTIVE / PENDING / INACTIVE
    List<Tenant> findByStatus(TenantStatus status);

    // Search by name, phone, or room number (Screenshot 1 search box)
    @Query("""
        SELECT t FROM Tenant t WHERE
        LOWER(t.fullName)    LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.phone)       LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.roomNumber)  LIKE LOWER(CONCAT('%',:q,'%'))
    """)
    List<Tenant> search(@Param("q") String query);

    // Search + filter combined
    @Query("""
        SELECT t FROM Tenant t WHERE t.status = :status AND (
        LOWER(t.fullName)    LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.phone)       LIKE LOWER(CONCAT('%',:q,'%')) OR
        LOWER(t.roomNumber)  LIKE LOWER(CONCAT('%',:q,'%')))
    """)
    List<Tenant> searchByStatus(@Param("status") TenantStatus status, @Param("q") String q);

    // Stats cards
    long countByStatus(TenantStatus status);

    // "MOVE-OUTS THIS MONTH" stat card
    @Query("SELECT COUNT(t) FROM Tenant t WHERE t.moveOutDate >= :start AND t.moveOutDate <= :end")
    long countMoveOutsBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    // Check if email already registered
    boolean existsByEmail(String email);

    // Check if room already has an active tenant
    Optional<Tenant> findByRoomIdAndStatus(Long roomId, TenantStatus status);
}

