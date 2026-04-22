package com.pgmanager.report.controller;

import com.pgmanager.report.dto.*;
import com.pgmanager.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

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

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@RequestParam String month) {
        byte[] content = reportService.exportPdf(month);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report-" + month + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(content);
    }

    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(@RequestParam String month) {
        byte[] content = reportService.exportExcel(month);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=report-" + month + ".xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(content);
    }
}
