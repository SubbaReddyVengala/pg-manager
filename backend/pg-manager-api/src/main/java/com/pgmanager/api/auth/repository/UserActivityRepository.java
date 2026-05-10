package com.pgmanager.api.auth.repository;

import com.pgmanager.api.auth.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    List<UserActivity> findByUserIdOrderByTimestampDesc(Long userId);
    List<UserActivity> findByOwnerIdOrderByTimestampDesc(Long ownerId);
    void deleteAllByOwnerId(Long ownerId);
}




