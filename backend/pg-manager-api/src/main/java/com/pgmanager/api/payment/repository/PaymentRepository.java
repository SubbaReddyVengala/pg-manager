package com.pgmanager.api.payment.repository;

import com.pgmanager.api.payment.entity.RentPayment;
import com.pgmanager.common.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<RentPayment, Long> {

    // All payments for a specific month (month picker)
    Page<RentPayment> findByOwnerIdAndRentMonth(Long ownerId, LocalDate rentMonth, Pageable pageable);

    // Filter by month + status (filter tabs)
    Page<RentPayment> findByOwnerIdAndRentMonthAndStatus(Long ownerId, LocalDate rentMonth, PaymentStatus status, Pageable pageable);

    // Month + Status + Search
    @Query("SELECT p FROM RentPayment p WHERE p.ownerId = :ownerId AND p.rentMonth = :month AND p.status = :status AND " +
            "(LOWER(p.tenantName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.roomNumber) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<RentPayment> searchByOwnerAndMonthAndStatus(@Param("ownerId") Long ownerId, @Param("month") LocalDate month, @Param("status") PaymentStatus status, @Param("q") String q, Pageable pageable);

    // Month + Search
    @Query("SELECT p FROM RentPayment p WHERE p.ownerId = :ownerId AND p.rentMonth = :month AND " +
            "(LOWER(p.tenantName) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.roomNumber) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<RentPayment> searchByOwnerAndMonth(@Param("ownerId") Long ownerId, @Param("month") LocalDate month, @Param("q") String q, Pageable pageable);

    // Check if due already generated for this tenant+month (idempotency)
    Optional<RentPayment> findByOwnerIdAndTenantIdAndRentMonth(Long ownerId, Long tenantId, LocalDate rentMonth);

    // All payments for a tenant (detail page payment history)
    List<RentPayment> findByOwnerIdAndTenantIdOrderByRentMonthDesc(Long ownerId, Long tenantId);

    List<RentPayment> findByOwnerIdAndStatus(Long ownerId, PaymentStatus status);

    @Query("SELECT p FROM RentPayment p WHERE p.rentMonth = :month AND p.status = :status")
    List<RentPayment> findAllByRentMonthAndStatus(@Param("month") LocalDate month, @Param("status") PaymentStatus status);

    // Stats: total collected in a month
    @Query("SELECT COALESCE(SUM(p.amountPaid), 0) FROM RentPayment p " +
            "WHERE p.ownerId = :ownerId AND p.rentMonth = :month AND p.status IN ('PAID', 'PARTIAL')")
    BigDecimal sumCollectedByOwnerAndMonth(@Param("ownerId") Long ownerId, @Param("month") LocalDate month);

    // Stats: total outstanding (balance) in a month
    @Query("SELECT COALESCE(SUM(p.balance), 0) FROM RentPayment p " +
            "WHERE p.ownerId = :ownerId AND p.rentMonth = :month AND p.status IN ('PENDING', 'PARTIAL', 'OVERDUE')")
    BigDecimal sumOutstandingByOwnerAndMonth(@Param("ownerId") Long ownerId, @Param("month") LocalDate month);

    // Stats: count by status in a month
    long countByOwnerIdAndRentMonthAndStatus(Long ownerId, LocalDate rentMonth, PaymentStatus status);

    // Due this week
    @Query("SELECT p FROM RentPayment p WHERE p.ownerId = :ownerId AND p.rentMonth = :month " +
            "AND p.status IN ('PENDING', 'OVERDUE')")
    List<RentPayment> findDueThisWeekByOwner(
            @Param("ownerId") Long ownerId,
            @Param("month") LocalDate month);

    @Query("SELECT COALESCE(SUM(p.amountPaid), 0) FROM RentPayment p " +
            "WHERE p.rentMonth = :month AND p.status IN ('PAID', 'PARTIAL')")
    BigDecimal sumAllCollectedByMonth(@Param("month") LocalDate month);

    void deleteAllByOwnerId(Long ownerId);
}




