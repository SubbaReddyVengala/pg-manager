package com.pgmanager.api.auth.repository;

import com.pgmanager.api.auth.entity.LimitRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LimitRequestRepository extends JpaRepository<LimitRequest, Long> {
    List<LimitRequest> findByStatusOrderByCreatedAtDesc(String status);
    long countByStatus(String status);
    List<LimitRequest> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    boolean existsByOwnerIdAndRequestTypeAndStatus(Long ownerId, String requestType, String status);
}




