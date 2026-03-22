package com.pgmanager.payment.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;
import com.pgmanager.payment.dto.*;
import com.pgmanager.payment.entity.RentPayment;
import com.pgmanager.payment.enums.PaymentStatus;
import com.pgmanager.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final PaymentRepository paymentRepository;
    private final PaymentServiceImpl paymentService;

    // ── Monthly Report ────────────────────────────────────────────────────
    @Override
    public MonthlyReportResponse getMonthlyReport(LocalDate month) {
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        List<RentPayment> payments = paymentRepository.findByRentMonth(firstOfMonth);

        BigDecimal totalCollected = payments.stream()
                .map(RentPayment::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRentDue = payments.stream()
                .map(RentPayment::getRentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalOutstanding = payments.stream()
                .map(RentPayment::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long paidCount    = payments.stream().filter(p -> p.getStatus() == PaymentStatus.PAID).count();
        long overdueCount = payments.stream().filter(p -> p.getStatus() == PaymentStatus.OVERDUE).count();
        long partialCount = payments.stream().filter(p -> p.getStatus() == PaymentStatus.PARTIAL).count();
        long pendingCount = payments.stream().filter(p -> p.getStatus() == PaymentStatus.PENDING).count();

        double collectionRate = totalRentDue.compareTo(BigDecimal.ZERO) > 0
                ? totalCollected.divide(totalRentDue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        List<PaymentResponse> paymentResponses = payments.stream()
                .map(paymentService::toResponse)
                .collect(Collectors.toList());

        return MonthlyReportResponse.builder()
                .month(firstOfMonth)
                .totalCollected(totalCollected)
                .totalOutstanding(totalOutstanding)
                .totalRentDue(totalRentDue)
                .totalTenants((long) payments.size())
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
            List<RentPayment> payments = paymentRepository.findByRentMonth(monthDate);

            BigDecimal collected = payments.stream()
                    .map(RentPayment::getAmountPaid)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal outstanding = payments.stream()
                    .map(RentPayment::getBalance)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            yearCollected   = yearCollected.add(collected);
            yearOutstanding = yearOutstanding.add(outstanding);

            months.add(AnnualSummaryResponse.MonthSummary.builder()
                    .monthLabel(monthDate.format(fmt))
                    .month(monthDate)
                    .collected(collected)
                    .outstanding(outstanding)
                    .tenantCount(payments.size())
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

        // Title
        document.add(new Paragraph("PG MANAGER — Monthly Income Report")
                .setTextAlignment(TextAlignment.CENTER).setFontSize(16).setBold());
        document.add(new Paragraph(month.format(fmt))
                .setTextAlignment(TextAlignment.CENTER).setFontSize(13)
                .setFontColor(ColorConstants.DARK_GRAY));
        document.add(new Paragraph("\n"));

        // Summary table
        com.itextpdf.layout.element.Table summary =
                new com.itextpdf.layout.element.Table(2).useAllAvailableWidth();
        addPdfRow(summary, "Total Rent Due",    "₹" + report.getTotalRentDue());
        addPdfRow(summary, "Total Collected",   "₹" + report.getTotalCollected());
        addPdfRow(summary, "Total Outstanding", "₹" + report.getTotalOutstanding());
        addPdfRow(summary, "Collection Rate",   report.getCollectionRate() + "%");
        addPdfRow(summary, "Paid",              String.valueOf(report.getPaidCount()));
        addPdfRow(summary, "Overdue",           String.valueOf(report.getOverdueCount()));
        addPdfRow(summary, "Partial",           String.valueOf(report.getPartialCount()));
        addPdfRow(summary, "Pending",           String.valueOf(report.getPendingCount()));
        document.add(summary);
        document.add(new Paragraph("\n"));

        // Tenant breakdown header
        document.add(new Paragraph("Tenant Payment Breakdown")
                .setFontSize(12).setBold());

        com.itextpdf.layout.element.Table details =
                new com.itextpdf.layout.element.Table(new float[]{3, 1, 2, 2, 2, 2})
                        .useAllAvailableWidth();

        // Table header
        for (String h : new String[]{"Tenant", "Room", "Rent Due", "Paid", "Balance", "Status"}) {
            details.addHeaderCell(
                    new com.itextpdf.layout.element.Cell()
                            .add(new Paragraph(h).setBold().setFontSize(10))
                            .setBackgroundColor(ColorConstants.LIGHT_GRAY));
        }

        // Table rows
        for (PaymentResponse p : report.getPayments()) {
            details.addCell(new com.itextpdf.layout.element.Cell()
                    .add(new Paragraph(p.getTenantName()).setFontSize(9)));
            details.addCell(new com.itextpdf.layout.element.Cell()
                    .add(new Paragraph(p.getRoomNumber()).setFontSize(9)));
            details.addCell(new com.itextpdf.layout.element.Cell()
                    .add(new Paragraph("₹" + p.getRentAmount()).setFontSize(9)));
            details.addCell(new com.itextpdf.layout.element.Cell()
                    .add(new Paragraph("₹" + p.getAmountPaid()).setFontSize(9)));
            details.addCell(new com.itextpdf.layout.element.Cell()
                    .add(new Paragraph("₹" + p.getBalance()).setFontSize(9)));
            details.addCell(new com.itextpdf.layout.element.Cell()
                    .add(new Paragraph(p.getStatus().name()).setFontSize(9)));
        }
        document.add(details);

        // Footer
        document.add(new Paragraph("\nGenerated by PG Manager System")
                .setTextAlignment(TextAlignment.CENTER).setFontSize(9)
                .setFontColor(ColorConstants.GRAY));

        document.close();
        return baos.toByteArray();
    }

    // ── Export Monthly Report as Excel ────────────────────────────────────
    @Override
    public byte[] exportMonthlyReportExcel(LocalDate month) {
        MonthlyReportResponse report = getMonthlyReport(month);
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
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
                org.apache.poi.ss.usermodel.Cell cell = header.createCell(i);
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

    // ── Private helper ────────────────────────────────────────────────────
    private void addPdfRow(com.itextpdf.layout.element.Table table,
                           String label, String value) {
        table.addCell(new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(label).setBold().setFontSize(10)));
        table.addCell(new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(value).setFontSize(10)));
    }
}