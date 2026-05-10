package com.pgmanager.api.notification.repository;

import com.pgmanager.api.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    
    long countByOwnerIdAndIsReadFalse(Long ownerId);
    
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.ownerId = :ownerId AND n.isRead = false")
    void markAllAsReadByOwner(@Param("ownerId") Long ownerId);

    void deleteAllByOwnerId(Long ownerId);
}




