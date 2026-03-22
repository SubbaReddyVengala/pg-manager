package com.pgmanager.payment.service;

import com.pgmanager.payment.dto.*;
import java.time.LocalDate;

public interface ReportService {
    MonthlyReportResponse  getMonthlyReport(LocalDate month);
    AnnualSummaryResponse  getAnnualSummary(int year);
    byte[]                 exportMonthlyReportPdf(LocalDate month);
    byte[]                 exportMonthlyReportExcel(LocalDate month);
}
