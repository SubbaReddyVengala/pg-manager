package com.pgmanager.api.maintenance.repository;

import com.pgmanager.api.maintenance.entity.GeneralExpense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface GeneralExpenseRepository extends JpaRepository<GeneralExpense, Long> {

    List<GeneralExpense> findByOwnerIdAndExpenseDateBetweenOrderByExpenseDateDesc(
            Long ownerId, LocalDate start, LocalDate end);

    @Query("SELECT SUM(e.amount) FROM GeneralExpense e WHERE e.ownerId = :ownerId AND e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumExpensesBetweenByOwner(
            @Param("ownerId") Long ownerId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    void deleteAllByOwnerId(Long ownerId);
}





