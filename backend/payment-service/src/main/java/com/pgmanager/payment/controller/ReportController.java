package com.pgmanager.payment.controller;

import com.pgmanager.payment.dto.*;
import com.pgmanager.payment.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // GET /reports/monthly?month=2026-03-01
    // Powers the monthly report page
    @GetMapping("/monthly")
    public ResponseEntity<MonthlyReportResponse> getMonthly(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        return ResponseEntity.ok(reportService.getMonthlyReport(month));
    }

    // GET /reports/annual?year=2026
    // Powers the bar chart on dashboard/reports
    @GetMapping("/annual")
    public ResponseEntity<AnnualSummaryResponse> getAnnual(
            @RequestParam int year) {
        return ResponseEntity.ok(reportService.getAnnualSummary(year));
    }

    // GET /reports/monthly/export/pdf?month=2026-03-01
    @GetMapping("/monthly/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        byte[] pdf = reportService.exportMonthlyReportPdf(month);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=report-" + month + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // GET /reports/monthly/export/excel?month=2026-03-01
    @GetMapping("/monthly/export/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        byte[] excel = reportService.exportMonthlyReportExcel(month);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=report-" + month + ".xlsx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }
}
