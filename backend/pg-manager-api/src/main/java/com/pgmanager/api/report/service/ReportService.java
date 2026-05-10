package com.pgmanager.api.report.service;

import com.pgmanager.api.report.dto.*;
import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    DashboardSummaryResponse getDashboardSummary();
    OccupancyTrendResponse getOccupancyTrend(int months);
    ProfitTrendResponse getProfitTrend(int months);
    List<OutstandingDueResponse> getOutstandingDues();
    GlobalSummaryResponse getGlobalSummary();
    MonthlyReportResponse getMonthlyReport(LocalDate month);
    AnnualSummaryResponse getAnnualSummary(int year);
    byte[] exportMonthlyReportPdf(LocalDate month);
    byte[] exportMonthlyReportExcel(LocalDate month);
}
