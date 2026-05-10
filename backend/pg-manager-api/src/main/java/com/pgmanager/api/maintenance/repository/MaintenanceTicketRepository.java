package com.pgmanager.api.maintenance.repository;

import com.pgmanager.api.maintenance.entity.MaintenanceTicket;
import com.pgmanager.common.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {
    List<MaintenanceTicket> findByOwnerIdAndStatus(Long ownerId, MaintenanceStatus status);
    long countByStatus(MaintenanceStatus status);
    List<MaintenanceTicket> findByOwnerId(Long ownerId);
    long countByOwnerIdAndStatus(Long ownerId, MaintenanceStatus status);

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))) / 86400.0 FROM maintenance_tickets WHERE owner_id = :ownerId AND resolved_at IS NOT NULL", nativeQuery = true)
    Double getAverageResolutionTimeInDaysByOwner(@Param("ownerId") Long ownerId);

    void deleteAllByOwnerId(Long ownerId);
}




