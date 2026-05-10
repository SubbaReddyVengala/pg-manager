package com.pgmanager.payment.repository;

import com.pgmanager.payment.entity.RentPayment;
import com.pgmanager.common.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<RentPayment, Long> {

    // All payments for a specific month (month picker)
    Page<RentPayment> findByUserIdAndRentMonth(Long userId, LocalDate rentMonth, Pageable pageable);

    // Filter by month + status (filter tabs)
    Page<RentPayment> findByUserIdAndRentMonthAndStatus(Long userId, LocalDate rentMonth, PaymentStatus status, Pageable pageable);

    // Check if due already generated for this tenant+month (idempotency)
    Optional<RentPayment> findByTenantIdAndRentMonth(Long tenantId, LocalDate rentMonth);

    // All payments for a tenant (detail page payment history)
    List<RentPayment> findByTenantIdOrderByRentMonthDesc(Long tenantId);

    // Stats: total collected in a month
    @Query("SELECT COALESCE(SUM(p.amountPaid), 0) FROM RentPayment p " +
            "WHERE p.userId = :userId AND p.rentMonth = :month AND p.status IN ('PAID', 'PARTIAL')")
    BigDecimal sumCollectedByMonth(@Param("userId") Long userId, @Param("month") LocalDate month);

    // Stats: total outstanding (balance) in a month
    @Query("SELECT COALESCE(SUM(p.balance), 0) FROM RentPayment p " +
            "WHERE p.userId = :userId AND p.rentMonth = :month AND p.status IN ('PENDING', 'PARTIAL', 'OVERDUE')")
    BigDecimal sumOutstandingByMonth(@Param("userId") Long userId, @Param("month") LocalDate month);

    // Stats: count by status in a month
    long countByUserIdAndRentMonthAndStatus(Long userId, LocalDate rentMonth, PaymentStatus status);

    // Due this week
    @Query("SELECT p FROM RentPayment p WHERE p.userId = :userId AND p.rentMonth = :month " +
            "AND p.status IN ('PENDING', 'OVERDUE')")
    List<RentPayment> findDueThisWeek(
            @Param("userId") Long userId,
            @Param("month") LocalDate month);

    Optional<RentPayment> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT p FROM RentPayment p WHERE p.userId = :userId AND p.rentMonth = :month AND p.status = :status")
    List<RentPayment> findAllByRentMonthAndStatus(@Param("userId") Long userId, @Param("month") LocalDate month, @Param("status") PaymentStatus status);

    @Query("SELECT p FROM RentPayment p WHERE p.userId = :userId AND p.rentMonth = :month")
    List<RentPayment> findAllByRentMonth(@Param("userId") Long userId, @Param("month") LocalDate month);

    List<RentPayment> findByRentMonthAndStatus(LocalDate rentMonth, PaymentStatus status);
}
