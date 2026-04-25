package com.pgmanager.api.payment.service;

import com.pgmanager.api.payment.dto.*;
import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    MonthlyReportResponse     getMonthlyReport(LocalDate month);
    AnnualSummaryResponse      getAnnualSummary(int year);
    DashboardSummaryResponse  getDashboardSummary();
    OccupancyTrendResponse    getOccupancyTrend(int months);
    ProfitTrendResponse       getProfitTrend(int months);
    List<OutstandingDueResponse> getOutstandingDues();
    byte[]                    exportMonthlyReportPdf(LocalDate month);
    byte[]                    exportMonthlyReportExcel(LocalDate month);
}
