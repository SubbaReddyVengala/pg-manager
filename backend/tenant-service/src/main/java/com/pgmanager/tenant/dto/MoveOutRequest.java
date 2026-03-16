package com.pgmanager.tenant.dto;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class MoveOutRequest {

    @NotNull(message = "Move-out date is required")
    private LocalDate moveOutDate;
}
