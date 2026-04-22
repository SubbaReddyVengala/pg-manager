package com.pgmanager.api.auth.repository;

import com.pgmanager.api.auth.entity.PgSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PgSettingsRepository extends JpaRepository<PgSettings, Long> {
    // There should only be one settings row globally
    Optional<PgSettings> findFirstByOrderByIdAsc();
}
