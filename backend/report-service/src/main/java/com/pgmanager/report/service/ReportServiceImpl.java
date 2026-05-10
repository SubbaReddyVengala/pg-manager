package com.pgmanager.report.service;

import com.pgmanager.report.client.ExternalServiceClient;
import com.pgmanager.report.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ExternalServiceClient externalClient;

    @Override
    @org.springframework.cache.annotation.Cacheable(value = "dashboardSummary")
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
        
        ExternalServiceClient.RoomStats roomStats = externalClient.getRoomStats();
        ExternalServiceClient.PaymentStats paymentStats = externalClient.getPaymentStats(currentMonth);
        ExternalServiceClient.MaintenanceStats maintenanceStats = externalClient.getMaintenanceStats();
        ExternalServiceClient.NetProfit netProfit = externalClient.getNetProfit(currentMonth);
        ExternalServiceClient.TenantStats tenantStats = externalClient.getTenantStats();

        return DashboardSummaryResponse.builder()
                .totalRooms(roomStats.getTotalRooms())
                .occupiedRooms(roomStats.getOccupied())
                .availableRooms(roomStats.getAvailable())
                .maintenanceRooms(roomStats.getMaintenance())
                .floorCount(roomStats.getFloorCount())
                .occupancyRate(roomStats.getOccupancyRate())
                
                .monthlyRevenue(netProfit.getTotalRevenue())
                .monthlyExpenses(netProfit.getTotalMaintenanceCost().add(netProfit.getTotalGeneralExpenses()))
                .monthlyProfit(netProfit.getNetProfit())
                .outstandingAmount(paymentStats.getOutstanding())
                .revenueGrowthRate(paymentStats.getGrowthRate())
                
                .activeTenants(tenantStats.getActive())
                .pendingTenants(tenantStats.getPending())
                
                .openMaintenanceTickets(maintenanceStats.getOpenCount())
                .overduePaymentsCount(paymentStats.getOverdueCount())
                .build();
    }

    @Override
    public OccupancyTrendResponse getOccupancyTrend(int months) {
        List<OccupancyTrendResponse.MonthOccupancy> trends = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        
        for (int i = months - 1; i >= 0; i--) {
            LocalDate month = LocalDate.now().minusMonths(i).withDayOfMonth(1);
            ExternalServiceClient.RoomStats stats = externalClient.getRoomStats();
            ExternalServiceClient.TenantStats tenantStats = externalClient.getTenantStats();

            trends.add(OccupancyTrendResponse.MonthOccupancy.builder()
                    .monthLabel(month.format(fmt))
                    .month(month)
                    .occupancyRate(stats.getOccupancyRate())
                    .totalTenants(tenantStats.getActive())
                    .build());
        }
        return OccupancyTrendResponse.builder().trends(trends).build();
    }

    @Override
    public ProfitTrendResponse getProfitTrend(int months) {
        List<ProfitTrendResponse.MonthProfit> trends = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = months - 1; i >= 0; i--) {
            LocalDate month = LocalDate.now().minusMonths(i).withDayOfMonth(1);
            ExternalServiceClient.NetProfit profit = externalClient.getNetProfit(month);

            trends.add(ProfitTrendResponse.MonthProfit.builder()
                    .monthLabel(month.format(fmt))
                    .month(month)
                    .revenue(profit.getTotalRevenue())
                    .expenses(profit.getTotalMaintenanceCost().add(profit.getTotalGeneralExpenses()))
                    .profit(profit.getNetProfit())
                    .build());
        }
        return ProfitTrendResponse.builder().trends(trends).build();
    }

    @Override
    public List<OutstandingDueResponse> getOutstandingDues() {
        // In a real system, we'd fetch this from payment-service.
        // Returning empty list as requested to clear dummy data.
        return List.of();
    }

    @Override
    public byte[] exportPdf(String monthStr) {
        LocalDate month = LocalDate.parse(monthStr);
        DashboardSummaryResponse summary = getDashboardSummary();
        List<ExternalServiceClient.PaymentDetail> payments = externalClient.getPaymentsByMonth(month);
        if (payments == null) payments = new ArrayList<>();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        com.lowagie.text.Document document = new com.lowagie.text.Document(com.lowagie.text.PageSize.A4);
        com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
        document.open();

        // Colors
        java.awt.Color primary = new java.awt.Color(30, 41, 59); // Slate 800
        java.awt.Color secondary = new java.awt.Color(71, 85, 105); // Slate 600

        // Title
        com.lowagie.text.Font titleFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 22, com.lowagie.text.Font.BOLD, primary);
        com.lowagie.text.Paragraph title = new com.lowagie.text.Paragraph("PG Manager - Monthly Analytics Report", titleFont);
        title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        document.add(title);

        com.lowagie.text.Font subTitleFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 14, com.lowagie.text.Font.NORMAL, secondary);
        com.lowagie.text.Paragraph subTitle = new com.lowagie.text.Paragraph("Performance Overview for " + month.format(DateTimeFormatter.ofPattern("MMMM yyyy")), subTitleFont);
        subTitle.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        subTitle.setSpacingAfter(30);
        document.add(subTitle);

        // Financial Summary Section
        com.lowagie.text.Font sectionFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 16, com.lowagie.text.Font.BOLD, primary);
        document.add(new com.lowagie.text.Paragraph("Financial Summary", sectionFont));
        document.add(new com.lowagie.text.Paragraph(" "));

        com.lowagie.text.pdf.PdfPTable finTable = new com.lowagie.text.pdf.PdfPTable(4);
        finTable.setWidthPercentage(100);
        addCell(finTable, "Total Revenue", true);
        addCell(finTable, "Total Expenses", true);
        addCell(finTable, "Net Profit", true);
        addCell(finTable, "Outstanding", true);
        addCell(finTable, "INR " + (summary.getMonthlyRevenue() != null ? summary.getMonthlyRevenue() : "0"), false);
        addCell(finTable, "INR " + (summary.getMonthlyExpenses() != null ? summary.getMonthlyExpenses() : "0"), false);
        addCell(finTable, "INR " + (summary.getMonthlyProfit() != null ? summary.getMonthlyProfit() : "0"), false);
        addCell(finTable, "INR " + (summary.getOutstandingAmount() != null ? summary.getOutstandingAmount() : "0"), false);
        document.add(finTable);

        document.add(new com.lowagie.text.Paragraph(" "));

        // Occupancy Section
        document.add(new com.lowagie.text.Paragraph("Occupancy & Operations", sectionFont));
        document.add(new com.lowagie.text.Paragraph(" "));
        com.lowagie.text.pdf.PdfPTable occTable = new com.lowagie.text.pdf.PdfPTable(4);
        occTable.setWidthPercentage(100);
        addCell(occTable, "Total Rooms", true);
        addCell(occTable, "Occupied", true);
        addCell(occTable, "Available", true);
        addCell(occTable, "Occupancy Rate", true);
        addCell(occTable, String.valueOf(summary.getTotalRooms()), false);
        addCell(occTable, String.valueOf(summary.getOccupiedRooms()), false);
        addCell(occTable, String.valueOf(summary.getAvailableRooms()), false);
        addCell(occTable, summary.getOccupancyRate() + "%", false);
        document.add(occTable);

        document.add(new com.lowagie.text.Paragraph(" "));

        // Detailed Payments Table
        document.add(new com.lowagie.text.Paragraph("Monthly Payment Details", sectionFont));
        document.add(new com.lowagie.text.Paragraph(" "));
        com.lowagie.text.pdf.PdfPTable payTable = new com.lowagie.text.pdf.PdfPTable(5);
        payTable.setWidthPercentage(100);
        addCell(payTable, "Tenant", true);
        addCell(payTable, "Room", true);
        addCell(payTable, "Rent", true);
        addCell(payTable, "Paid", true);
        addCell(payTable, "Status", true);

        for (ExternalServiceClient.PaymentDetail p : payments) {
            addCell(payTable, p.getTenantName() != null ? p.getTenantName() : "-", false);
            addCell(payTable, p.getRoomNumber() != null ? p.getRoomNumber() : "-", false);
            addCell(payTable, "INR " + (p.getRentAmount() != null ? p.getRentAmount() : "0"), false);
            addCell(payTable, "INR " + (p.getAmountPaid() != null ? p.getAmountPaid() : "0"), false);
            addCell(payTable, p.getStatus() != null ? p.getStatus() : "-", false);
        }
        document.add(payTable);

        document.close();
        return out.toByteArray();
    }

    private void addCell(com.lowagie.text.pdf.PdfPTable table, String text, boolean isHeader) {
        com.lowagie.text.pdf.PdfPCell cell = new com.lowagie.text.pdf.PdfPCell(new com.lowagie.text.Paragraph(text, 
            new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 10, isHeader ? com.lowagie.text.Font.BOLD : com.lowagie.text.Font.NORMAL)));
        cell.setPadding(8);
        if (isHeader) cell.setBackgroundColor(new java.awt.Color(241, 245, 249));
        table.addCell(cell);
    }

    @Override
    public byte[] exportExcel(String monthStr) {
        LocalDate month = LocalDate.parse(monthStr);
        DashboardSummaryResponse summary = getDashboardSummary();
        List<ExternalServiceClient.PaymentDetail> payments = externalClient.getPaymentsByMonth(month);
        List<ExternalServiceClient.RoomDetail> rooms = externalClient.getAllRooms();
        List<ExternalServiceClient.TenantDetail> tenants = externalClient.getAllTenants();

        if (payments == null) payments = new ArrayList<>();
        if (rooms == null) rooms = new ArrayList<>();
        if (tenants == null) tenants = new ArrayList<>();

        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            // 1. Summary Sheet
            org.apache.poi.ss.usermodel.Sheet sheet1 = workbook.createSheet("Executive Summary");
            createSummarySheet(sheet1, summary, month.format(DateTimeFormatter.ofPattern("MMMM yyyy")));
            
            // 2. Payments Sheet
            org.apache.poi.ss.usermodel.Sheet sheet2 = workbook.createSheet("Payments Detail");
            createPaymentSheet(sheet2, payments);

            // 3. Rooms Sheet
            org.apache.poi.ss.usermodel.Sheet sheet3 = workbook.createSheet("Room Inventory");
            createRoomSheet(sheet3, rooms);
            
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Excel generation failed", e);
        }
    }

    private void createSummarySheet(org.apache.poi.ss.usermodel.Sheet sheet, DashboardSummaryResponse s, String month) {
        org.apache.poi.ss.usermodel.Row row0 = sheet.createRow(0);
        row0.createCell(0).setCellValue("PG Manager - Monthly Report Summary: " + month);
        
        String[][] data = {
            {"Financials", ""},
            {"Total Revenue", s.getMonthlyRevenue().toString()},
            {"Total Expenses", s.getMonthlyExpenses().toString()},
            {"Net Profit", s.getMonthlyProfit().toString()},
            {"Outstanding Amount", s.getOutstandingAmount().toString()},
            {"", ""},
            {"Occupancy", ""},
            {"Total Rooms", String.valueOf(s.getTotalRooms())},
            {"Occupied Rooms", String.valueOf(s.getOccupiedRooms())},
            {"Available Rooms", String.valueOf(s.getAvailableRooms())},
            {"Occupancy Rate", s.getOccupancyRate() + "%"},
            {"", ""},
            {"Tenants", ""},
            {"Active Tenants", String.valueOf(s.getActiveTenants())},
            {"Pending Tenants", String.valueOf(s.getPendingTenants())}
        };
        
        for (int i = 0; i < data.length; i++) {
            org.apache.poi.ss.usermodel.Row row = sheet.createRow(i + 2);
            row.createCell(0).setCellValue(data[i][0]);
            row.createCell(1).setCellValue(data[i][1]);
        }
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void createPaymentSheet(org.apache.poi.ss.usermodel.Sheet sheet, List<ExternalServiceClient.PaymentDetail> payments) {
        String[] headers = {"Tenant Name", "Room", "Rent Amount", "Amount Paid", "Balance", "Status", "Date"};
        org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        int rowNum = 1;
        for (ExternalServiceClient.PaymentDetail p : payments) {
            org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(p.getTenantName());
            row.createCell(1).setCellValue(p.getRoomNumber());
            row.createCell(2).setCellValue(p.getRentAmount().doubleValue());
            row.createCell(3).setCellValue(p.getAmountPaid().doubleValue());
            row.createCell(4).setCellValue(p.getBalance().doubleValue());
            row.createCell(5).setCellValue(p.getStatus());
            row.createCell(6).setCellValue(p.getPaymentDate() != null ? p.getPaymentDate().toString() : "-");
        }
        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }

    private void createRoomSheet(org.apache.poi.ss.usermodel.Sheet sheet, List<ExternalServiceClient.RoomDetail> rooms) {
        String[] headers = {"Room No", "Floor", "Type", "Capacity", "Occupancy", "Rent", "Status"};
        org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            headerRow.createCell(i).setCellValue(headers[i]);
        }

        int rowNum = 1;
        for (ExternalServiceClient.RoomDetail r : rooms) {
            org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(r.getRoomNumber());
            row.createCell(1).setCellValue(r.getFloor());
            row.createCell(2).setCellValue(r.getRoomType());
            row.createCell(3).setCellValue(r.getMaxCapacity());
            row.createCell(4).setCellValue(r.getOccupancy());
            row.createCell(5).setCellValue(r.getRentAmount().doubleValue());
            row.createCell(6).setCellValue(r.getStatus());
        }
        for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
    }
}
