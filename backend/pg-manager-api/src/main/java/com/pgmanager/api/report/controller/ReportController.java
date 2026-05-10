package com.pgmanager.api.report.controller;

import com.pgmanager.api.report.dto.*;
import com.pgmanager.api.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/global-summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<GlobalSummaryResponse> getGlobalSummary() {
        return ResponseEntity.ok(reportService.getGlobalSummary());
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(reportService.getDashboardSummary());
    }

    @GetMapping("/trends/occupancy")
    public ResponseEntity<OccupancyTrendResponse> getOccupancyTrend(@RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(reportService.getOccupancyTrend(months));
    }

    @GetMapping("/trends/profit")
    public ResponseEntity<ProfitTrendResponse> getProfitTrend(@RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(reportService.getProfitTrend(months));
    }

    @GetMapping("/outstanding-dues")
    public ResponseEntity<List<OutstandingDueResponse>> getOutstandingDues() {
        return ResponseEntity.ok(reportService.getOutstandingDues());
    }

    @GetMapping("/monthly")
    public ResponseEntity<MonthlyReportResponse> getMonthly(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        return ResponseEntity.ok(reportService.getMonthlyReport(month));
    }

    @GetMapping("/annual")
    public ResponseEntity<AnnualSummaryResponse> getAnnual(
            @RequestParam int year) {
        return ResponseEntity.ok(reportService.getAnnualSummary(year));
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        byte[] content = reportService.exportMonthlyReportPdf(month);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report-" + month + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(content);
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        byte[] content = reportService.exportMonthlyReportExcel(month);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report-" + month + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(content);
    }
}
