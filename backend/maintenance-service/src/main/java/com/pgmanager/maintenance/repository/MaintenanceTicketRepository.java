package com.pgmanager.maintenance.repository;

import com.pgmanager.maintenance.entity.MaintenanceTicket;
import com.pgmanager.maintenance.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {
    List<MaintenanceTicket> findByStatus(MaintenanceStatus status);
    long countByStatus(MaintenanceStatus status);

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))) / 86400.0 FROM maintenance_tickets WHERE resolved_at IS NOT NULL", nativeQuery = true)
    Double getAverageResolutionTimeInDays();
}
