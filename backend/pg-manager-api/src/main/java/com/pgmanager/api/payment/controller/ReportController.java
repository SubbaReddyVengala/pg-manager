package com.pgmanager.api.payment.controller;

import com.pgmanager.api.payment.dto.*;
import com.pgmanager.api.payment.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // GET /reports/dashboard-summary
    @GetMapping("/dashboard-summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(reportService.getDashboardSummary());
    }

    // GET /reports/trends/occupancy?months=6
    @GetMapping("/trends/occupancy")
    public ResponseEntity<OccupancyTrendResponse> getOccupancyTrend(@RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(reportService.getOccupancyTrend(months));
    }

    // GET /reports/trends/profit?months=6
    @GetMapping("/trends/profit")
    public ResponseEntity<ProfitTrendResponse> getProfitTrend(@RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(reportService.getProfitTrend(months));
    }

    // GET /reports/outstanding-dues
    @GetMapping("/outstanding-dues")
    public ResponseEntity<List<OutstandingDueResponse>> getOutstandingDues() {
        return ResponseEntity.ok(reportService.getOutstandingDues());
    }

    // GET /reports/monthly?month=2026-03-01
    @GetMapping("/monthly")
    public ResponseEntity<MonthlyReportResponse> getMonthly(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        return ResponseEntity.ok(reportService.getMonthlyReport(month));
    }

    // GET /reports/annual?year=2026
    @GetMapping("/annual")
    public ResponseEntity<AnnualSummaryResponse> getAnnual(
            @RequestParam int year) {
        return ResponseEntity.ok(reportService.getAnnualSummary(year));
    }

    // GET /reports/export/pdf?month=2026-03-01
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        byte[] pdf = reportService.exportMonthlyReportPdf(month);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=report-" + month + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    // GET /reports/export/excel?month=2026-03-01
    @GetMapping("/export/excel")
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
