package com.pgmanager.auth.repository;

import com.pgmanager.auth.entity.AccountEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AccountEventRepository extends JpaRepository<AccountEvent, UUID> {
    List<AccountEvent> findByUserIdOrderByCreatedAtDesc(Long userId);
}
