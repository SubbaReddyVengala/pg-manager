package com.pgmanager.maintenance.repository;

import com.pgmanager.maintenance.entity.GeneralExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface GeneralExpenseRepository extends JpaRepository<GeneralExpense, Long> {
    List<GeneralExpense> findByUserIdAndExpenseDateBetween(Long userId, LocalDate start, LocalDate end);

    @Query("SELECT SUM(e.amount) FROM GeneralExpense e WHERE e.userId = :userId AND e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumAmountByUserIdAndExpenseDateBetween(Long userId, LocalDate start, LocalDate end);

    List<GeneralExpense> findByUserId(Long userId);
}
