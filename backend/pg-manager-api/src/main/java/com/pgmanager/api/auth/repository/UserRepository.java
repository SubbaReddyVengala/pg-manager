package com.pgmanager.api.auth.repository;
import com.pgmanager.api.auth.entity.User;
import com.pgmanager.common.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByRefreshToken(String token);
    Optional<User> findByResetToken(String token);
    List<User> findByOwnerId(Long ownerId);
    List<User> findAllByRole(Role role);
    long countByRole(Role role);
    long countByRoleAndStatus(Role role, com.pgmanager.common.enums.AccountStatus status);
}




