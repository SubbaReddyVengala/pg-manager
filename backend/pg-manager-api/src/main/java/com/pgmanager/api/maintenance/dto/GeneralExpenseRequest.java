package com.pgmanager.api.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class GeneralExpenseRequest {
    @NotBlank(message = "Category is required")
    @Size(min = 2, max = 50, message = "Category must be between 2 and 50 characters")
    private String category;
    
    @NotBlank(message = "Description is required")
    @Size(min = 2, max = 255, message = "Description must be between 2 and 255 characters")
    private String description;
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Amount must have at most 2 decimal places")
    private BigDecimal amount;
    
    @NotNull(message = "Expense date is required")
    private LocalDate expenseDate;
    
    @Size(max = 255, message = "Note must not exceed 255 characters")
    private String note;
}




