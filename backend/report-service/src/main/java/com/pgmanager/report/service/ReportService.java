package com.pgmanager.report.service;

import com.pgmanager.report.dto.*;
import java.util.List;

public interface ReportService {
    DashboardSummaryResponse getDashboardSummary();
    OccupancyTrendResponse getOccupancyTrend(int months);
    ProfitTrendResponse getProfitTrend(int months);
    
    // New for Screenshot 5
    List<OutstandingDueResponse> getOutstandingDues();
    byte[] exportPdf(String month);
    byte[] exportExcel(String month);
}
