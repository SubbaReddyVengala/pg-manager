package com.pgmanager.payment.repository;

import com.pgmanager.payment.entity.RentPayment;
import com.pgmanager.payment.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<RentPayment, Long> {

    // All payments for a specific month (month picker)
    List<RentPayment> findByRentMonth(LocalDate rentMonth);

    // Filter by month + status (filter tabs)
    List<RentPayment> findByRentMonthAndStatus(LocalDate rentMonth, PaymentStatus status);

    // Check if due already generated for this tenant+month (idempotency)
    Optional<RentPayment> findByTenantIdAndRentMonth(Long tenantId, LocalDate rentMonth);

    // All payments for a tenant (detail page payment history)
    List<RentPayment> findByTenantIdOrderByRentMonthDesc(Long tenantId);

    // Stats: total collected in a month
    @Query("SELECT COALESCE(SUM(p.amountPaid), 0) FROM RentPayment p " +
            "WHERE p.rentMonth = :month AND p.status IN ('PAID', 'PARTIAL')")
    BigDecimal sumCollectedByMonth(@Param("month") LocalDate month);

    // Stats: total outstanding (balance) in a month
    @Query("SELECT COALESCE(SUM(p.balance), 0) FROM RentPayment p " +
            "WHERE p.rentMonth = :month AND p.status IN ('PENDING', 'PARTIAL', 'OVERDUE')")
    BigDecimal sumOutstandingByMonth(@Param("month") LocalDate month);

    // Stats: count by status in a month
    long countByRentMonthAndStatus(LocalDate rentMonth, PaymentStatus status);

    // Due this week
    @Query("SELECT p FROM RentPayment p WHERE p.rentMonth = :month " +
            "AND p.status IN ('PENDING', 'OVERDUE')")
    List<RentPayment> findDueThisWeek(
            @Param("month") LocalDate month,
            @Param("fromDay") int fromDay,
            @Param("toDay") int toDay);
}
