package com.pgmanager.api.report.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.pgmanager.api.auth.repository.UserRepository;
import com.pgmanager.api.maintenance.dto.MaintenanceStatsResponse;
import com.pgmanager.api.maintenance.dto.NetProfitResponse;
import com.pgmanager.api.maintenance.service.MaintenanceService;
import com.pgmanager.api.payment.dto.PaymentResponse;
import com.pgmanager.api.payment.dto.PaymentStatsResponse;
import com.pgmanager.api.payment.repository.PaymentRepository;
import com.pgmanager.api.payment.service.PaymentService;
import com.pgmanager.api.report.dto.*;
import com.pgmanager.api.room.dto.RoomStatsResponse;
import com.pgmanager.api.room.service.RoomService;
import com.pgmanager.api.tenant.dto.TenantStatsResponse;
import com.pgmanager.api.tenant.service.TenantService;
import com.pgmanager.common.enums.PaymentStatus;
import com.pgmanager.common.enums.Role;
import com.pgmanager.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;
    private final RoomService roomService;
    private final TenantService tenantService;
    private final MaintenanceService maintenanceService;

    // ── Global Summary (Super Admin) ──────────────────────────────────────
    @Override
    public GlobalSummaryResponse getGlobalSummary() {
        long totalOwners = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.OWNER)
                .count();

        BigDecimal totalRevenueAllTime = paymentRepository.findAll().stream()
                .map(p -> p.getAmountPaid() != null ? p.getAmountPaid() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long totalRoomsAcrossPlatform = roomService.countAllRoomsIgnoreOwner();
        long totalTenantsAcrossPlatform = tenantService.countAllTenantsIgnoreOwner();

        return GlobalSummaryResponse.builder()
                .totalOwners((int) totalOwners)
                .totalRevenue(totalRevenueAllTime)
                .totalRooms((int) totalRoomsAcrossPlatform)
                .totalTenants((int) totalTenantsAcrossPlatform)
                .build();
    }

    // ── Dashboard Summary ─────────────────────────────────────────────────
    @Override
    @Cacheable(value = "dashboardStats", key = "T(com.pgmanager.common.util.SecurityUtils).getCurrentOwnerId()")
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
        
        RoomStatsResponse roomStats = roomService.getStats();
        TenantStatsResponse tenantStats = tenantService.getStats();
        PaymentStatsResponse paymentStats = paymentService.getStats(currentMonth);
        MaintenanceStatsResponse maintenanceStats = maintenanceService.getStats();
        NetProfitResponse netProfit = maintenanceService.getNetProfit(currentMonth);

        return DashboardSummaryResponse.builder()
                .totalRooms(roomStats.getTotalRooms())
                .occupiedRooms(roomStats.getOccupied())
                .availableRooms(roomStats.getAvailable())
                .maintenanceRooms(roomStats.getMaintenance())
                .occupancyRate(roomStats.getOccupancyRate())
                .floorCount(roomStats.getFloorCount())
                
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

    // ── Occupancy Trend ───────────────────────────────────────────────────
    @Override
    public OccupancyTrendResponse getOccupancyTrend(int months) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        List<OccupancyTrendResponse.MonthOccupancy> trends = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");
        
        long totalCapacity = roomService.getStats().getTotalRooms();

        for (int i = months - 1; i >= 0; i--) {
            LocalDate monthStart = LocalDate.now().minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd   = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
            
            long activeTenants = tenantService.countActiveInMonth(ownerId, monthStart, monthEnd);
            double occupancyRate = totalCapacity > 0 ? (activeTenants * 100.0 / totalCapacity) : 0.0;

            trends.add(OccupancyTrendResponse.MonthOccupancy.builder()
                    .monthLabel(monthStart.format(fmt))
                    .month(monthStart)
                    .occupancyRate(occupancyRate > 100 ? 100.0 : occupancyRate)
                    .totalTenants((int) activeTenants)
                    .build());
        }
        return OccupancyTrendResponse.builder().trends(trends).build();
    }

    // ── Profit Trend ──────────────────────────────────────────────────────
    @Override
    public ProfitTrendResponse getProfitTrend(int months) {
        List<ProfitTrendResponse.MonthProfit> trends = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM yyyy");

        for (int i = months - 1; i >= 0; i--) {
            LocalDate month = LocalDate.now().minusMonths(i).withDayOfMonth(1);
            NetProfitResponse profit = maintenanceService.getNetProfit(month);

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

    // ── Outstanding Dues ──────────────────────────────────────────────────
    @Override
    public List<OutstandingDueResponse> getOutstandingDues() {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        return paymentRepository.findByOwnerIdAndStatus(ownerId, PaymentStatus.OVERDUE).stream()
                .map(p -> OutstandingDueResponse.builder()
                        .tenantName(p.getTenantName())
                        .roomNumber(p.getRoomNumber())
                        .amountDue(p.getBalance())
                        .daysOverdue(ChronoUnit.DAYS.between(p.getRentMonth().withDayOfMonth(5), LocalDate.now()))
                        .lastReminder(null)
                        .build())
                .collect(Collectors.toList());
    }

    // ── Monthly Report ────────────────────────────────────────────────────
    @Override
    public MonthlyReportResponse getMonthlyReport(LocalDate month) {
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        Page<PaymentResponse> paymentPage = paymentService.getPaymentsByMonth(firstOfMonth, null, null, Pageable.unpaged());
        List<PaymentResponse> paymentResponses = paymentPage.getContent();

        BigDecimal totalCollected = paymentResponses.stream()
                .map(p -> p.getAmountPaid() != null ? p.getAmountPaid() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRentDue = paymentResponses.stream()
                .map(p -> p.getRentAmount() != null ? p.getRentAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOutstanding = paymentResponses.stream()
                .map(p -> p.getBalance() != null ? p.getBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long paidCount    = paymentResponses.stream().filter(p -> p.getStatus() == PaymentStatus.PAID).count();
        long overdueCount = paymentResponses.stream().filter(p -> p.getStatus() == PaymentStatus.OVERDUE).count();
        long partialCount = paymentResponses.stream().filter(p -> p.getStatus() == PaymentStatus.PARTIAL).count();
        long pendingCount = paymentResponses.stream().filter(p -> p.getStatus() == PaymentStatus.PENDING).count();

        double collectionRate = totalRentDue.compareTo(BigDecimal.ZERO) > 0
                ? totalCollected.divide(totalRentDue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        return MonthlyReportResponse.builder()
                .month(firstOfMonth)
                .totalCollected(totalCollected)
                .totalOutstanding(totalOutstanding)
                .totalRentDue(totalRentDue)
                .totalTenants((long) paymentResponses.size())
                .paidCount(paidCount)
                .overdueCount(overdueCount)
                .partialCount(partialCount)
                .pendingCount(pendingCount)
                .collectionRate(collectionRate)
                .payments(paymentResponses)
                .build();
    }

    // ── Annual Summary ────────────────────────────────────────────────────
    @Override
    public AnnualSummaryResponse getAnnualSummary(int year) {
        List<AnnualSummaryResponse.MonthSummary> months = new ArrayList<>();
        BigDecimal yearCollected   = BigDecimal.ZERO;
        BigDecimal yearOutstanding = BigDecimal.ZERO;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM");

        for (int m = 1; m <= 12; m++) {
            LocalDate monthDate = LocalDate.of(year, m, 1);
            Page<PaymentResponse> paymentPage = paymentService.getPaymentsByMonth(monthDate, null, null, Pageable.unpaged());
            List<PaymentResponse> paymentResponses = paymentPage.getContent();

            BigDecimal collected = paymentResponses.stream()
                    .map(p -> p.getAmountPaid() != null ? p.getAmountPaid() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal outstanding = paymentResponses.stream()
                    .map(p -> p.getBalance() != null ? p.getBalance() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            yearCollected   = yearCollected.add(collected);
            yearOutstanding = yearOutstanding.add(outstanding);

            months.add(AnnualSummaryResponse.MonthSummary.builder()
                    .monthLabel(monthDate.format(fmt))
                    .month(monthDate)
                    .collected(collected)
                    .outstanding(outstanding)
                    .tenantCount(paymentResponses.size())
                    .build());
        }

        return AnnualSummaryResponse.builder()
                .year(year)
                .totalCollected(yearCollected)
                .totalOutstanding(yearOutstanding)
                .months(months)
                .build();
    }

    // ── Export Monthly Report as PDF ──────────────────────────────────────
    @Override
    public byte[] exportMonthlyReportPdf(LocalDate month) {
        MonthlyReportResponse report = getMonthlyReport(month);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer   = new PdfWriter(baos);
        PdfDocument pdf    = new PdfDocument(writer);
        Document document  = new Document(pdf);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMMM yyyy");

        DeviceRgb slate800 = new DeviceRgb(30, 41, 59);
        DeviceRgb slate600 = new DeviceRgb(71, 85, 105);
        DeviceRgb slate500 = new DeviceRgb(100, 116, 139);
        DeviceRgb slate50  = new DeviceRgb(248, 250, 252);
        DeviceRgb slate100 = new DeviceRgb(241, 245, 249);

        // Header Bar
        com.itextpdf.layout.element.Table header = new com.itextpdf.layout.element.Table(1).useAllAvailableWidth().setBackgroundColor(slate800);
        header.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("MONTHLY PERFORMANCE REPORT").setFontSize(14).setBold().setFontColor(ColorConstants.WHITE).setMarginLeft(20))
                .setPaddingTop(15).setPaddingBottom(15).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        document.add(header);

        document.add(new Paragraph(month.format(fmt)).setFontSize(12).setBold().setFontColor(slate600).setMarginTop(20).setMarginBottom(20));

        // Summary Grid
        document.add(new Paragraph("FINANCIAL SUMMARY").setFontSize(9).setBold().setFontColor(slate500).setCharacterSpacing(1f));
        com.itextpdf.layout.element.Table summary = new com.itextpdf.layout.element.Table(4).useAllAvailableWidth().setMarginBottom(30);
        addSummaryCell(summary, "TOTAL REVENUE", "₹" + report.getTotalCollected(), slate500, slate800);
        addSummaryCell(summary, "OUTSTANDING", "₹" + report.getTotalOutstanding(), slate500, slate800);
        addSummaryCell(summary, "COLLECTION %", report.getCollectionRate() + "%", slate500, slate800);
        addSummaryCell(summary, "TENANTS", String.valueOf(report.getTotalTenants()), slate500, slate800);
        document.add(summary);

        // Tenant breakdown header
        document.add(new Paragraph("TENANT PAYMENT BREAKDOWN").setFontSize(9).setBold().setFontColor(slate500).setCharacterSpacing(1f).setMarginBottom(10));

        com.itextpdf.layout.element.Table details = new com.itextpdf.layout.element.Table(new float[]{3, 1, 2, 2, 2, 2}).useAllAvailableWidth();

        // Table header
        String[] headers = {"Tenant", "Room", "Due", "Paid", "Balance", "Status"};
        for (String h : headers) {
            details.addHeaderCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(h).setBold().setFontSize(8).setFontColor(slate600))
                            .setBackgroundColor(slate100).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setPadding(8));
        }

        // Table rows
        for (PaymentResponse p : report.getPayments()) {
            details.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(p.getTenantName()).setFontSize(9).setFontColor(slate800)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(slate100, 0.5f)).setPadding(8));
            details.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(p.getRoomNumber()).setFontSize(9).setFontColor(slate800)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(slate100, 0.5f)).setPadding(8));
            details.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("₹" + p.getRentAmount()).setFontSize(9).setFontColor(slate800)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(slate100, 0.5f)).setPadding(8));
            details.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("₹" + p.getAmountPaid()).setFontSize(9).setBold().setFontColor(new DeviceRgb(16, 185, 129))).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(slate100, 0.5f)).setPadding(8));
            details.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("₹" + p.getBalance()).setFontSize(9).setFontColor(slate800)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(slate100, 0.5f)).setPadding(8));
            details.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(p.getStatus().name()).setFontSize(8).setBold().setFontColor(p.getStatus().name().equals("PAID") ? new DeviceRgb(16, 185, 129) : slate600)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(slate100, 0.5f)).setPadding(8));
        }
        document.add(details);

        // Footer
        document.add(new Paragraph("\n\nGenerated by PG Manager System — Professional Business Review")
                .setTextAlignment(TextAlignment.CENTER).setFontSize(8).setFontColor(slate500).setItalic());

        document.close();
        return baos.toByteArray();
    }

    private void addSummaryCell(com.itextpdf.layout.element.Table table, String label, String value, DeviceRgb labelCol, DeviceRgb valCol) {
        table.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(label).setFontSize(7).setBold().setFontColor(labelCol))
                .add(new Paragraph(value).setFontSize(14).setBold().setFontColor(valCol))
                .setPadding(10).setBackgroundColor(new DeviceRgb(248, 250, 252)).setBorder(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(226, 232, 240), 0.5f)));
    }

    // ── Export Monthly Report as Excel ────────────────────────────────────
    @Override
    public byte[] exportMonthlyReportExcel(LocalDate month) {
        MonthlyReportResponse report = getMonthlyReport(month);
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Monthly Report");

            // Header row
            Row header = sheet.createRow(0);
            String[] cols = {"Tenant", "Room", "Rent Due", "Amount Paid", "Balance", "Status", "Payment Date", "Mode"};

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            for (int i = 0; i < cols.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(cols[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            // Data rows
            int rowNum = 1;
            for (PaymentResponse p : report.getPayments()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getTenantName());
                row.createCell(1).setCellValue(p.getRoomNumber());
                row.createCell(2).setCellValue(p.getRentAmount().doubleValue());
                row.createCell(3).setCellValue(p.getAmountPaid().doubleValue());
                row.createCell(4).setCellValue(p.getBalance().doubleValue());
                row.createCell(5).setCellValue(p.getStatus().name());
                row.createCell(6).setCellValue(
                        p.getPaymentDate() != null ? p.getPaymentDate().toString() : "");
                row.createCell(7).setCellValue(
                        p.getPaymentMode() != null ? p.getPaymentMode().name() : "");
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Excel report: " + e.getMessage(), e);
        }
    }
}
