package com.pgmanager.api.maintenance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

import org.hibernate.annotations.Filter;
import com.pgmanager.api.common.constant.TenantConstants;

import com.pgmanager.api.common.entity.TenantEntityListener;

@Entity
@Table(name = "general_expenses")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(TenantEntityListener.class)
@Filter(name = TenantConstants.TENANT_FILTER_NAME, condition = TenantConstants.TENANT_COLUMN_NAME + " = :" + TenantConstants.TENANT_PARAMETER_NAME)
public class GeneralExpense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long ownerId;
    @Column(nullable = false)
    private String category;
    private String description;
    @Column(nullable = false)
    private BigDecimal amount;
    @Column(nullable = false)
    private LocalDate expenseDate;
    private String note;
}




