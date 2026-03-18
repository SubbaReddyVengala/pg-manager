package com.pgmanager.payment.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class GenerateDuesRequest {
    private LocalDate month;   // e.g. 2026-03-01 — generate dues for this month
}

