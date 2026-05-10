package com.pgmanager.auth.repository;

import com.pgmanager.auth.entity.StaffUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StaffUserRepository extends JpaRepository<StaffUser, UUID> {
    Optional<StaffUser> findByEmail(String email);
    Optional<StaffUser> findByRefreshToken(String refreshToken);
    List<StaffUser> findByOwnerId(Long ownerId);
    List<StaffUser> findByTenantId(UUID tenantId);
}
