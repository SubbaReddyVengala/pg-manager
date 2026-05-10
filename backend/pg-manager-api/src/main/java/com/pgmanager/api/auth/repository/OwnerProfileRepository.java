package com.pgmanager.api.auth.repository;

import com.pgmanager.api.auth.entity.OwnerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OwnerProfileRepository extends JpaRepository<OwnerProfile, Long> {
    Optional<OwnerProfile> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}




