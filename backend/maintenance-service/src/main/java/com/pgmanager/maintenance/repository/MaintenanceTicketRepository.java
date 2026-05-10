package com.pgmanager.maintenance.repository;

import com.pgmanager.maintenance.entity.MaintenanceTicket;
import com.pgmanager.common.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

import java.util.Optional;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {
    List<MaintenanceTicket> findByUserIdAndStatus(Long userId, MaintenanceStatus status);
    List<MaintenanceTicket> findByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, MaintenanceStatus status);

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - reported_at))) / 86400.0 FROM maintenance_tickets WHERE user_id = :userId AND resolved_at IS NOT NULL", nativeQuery = true)
    Double getAverageResolutionTimeInDays(Long userId);

    Optional<MaintenanceTicket> findByIdAndUserId(Long id, Long userId);
}
