package com.pgmanager.api.payment.service;

import com.pgmanager.api.payment.dto.*;
import java.time.LocalDate;

public interface ReportService {
    MonthlyReportResponse  getMonthlyReport(LocalDate month);
    AnnualSummaryResponse  getAnnualSummary(int year);
    byte[]                 exportMonthlyReportPdf(LocalDate month);
    byte[]                 exportMonthlyReportExcel(LocalDate month);
}
