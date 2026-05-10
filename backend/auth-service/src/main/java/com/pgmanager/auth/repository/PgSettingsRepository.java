package com.pgmanager.auth.repository;

import com.pgmanager.auth.entity.PgSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PgSettingsRepository extends JpaRepository<PgSettings, Long> {
    Optional<PgSettings> findByUserId(Long userId);
}
