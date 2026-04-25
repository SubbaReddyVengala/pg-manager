package com.pgmanager.payment.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.pgmanager.payment.client.TenantServiceClient;
import com.pgmanager.payment.dto.*;
import com.pgmanager.payment.entity.RentPayment;
import com.pgmanager.payment.enums.PaymentStatus;
import com.pgmanager.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository     paymentRepository;
    private final TenantServiceClient   tenantClient;
    private final com.pgmanager.payment.client.NotificationServiceClient notificationClient;

    @Override
    public Page<PaymentResponse> getPaymentsByMonth(LocalDate month, PaymentStatus status, Pageable pageable) {
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        Page<RentPayment> payments = status != null
                ? paymentRepository.findByRentMonthAndStatus(firstOfMonth, status, pageable)
                : paymentRepository.findByRentMonth(firstOfMonth, pageable);
        payments.forEach(this::refreshOverdueStatus);
        return payments.map(this::toResponse);
    }

    @Override
    public PaymentResponse recordPayment(PaymentRequest req) {
        LocalDate firstOfMonth = req.getRentMonth().withDayOfMonth(1);
        RentPayment payment = paymentRepository
                .findByTenantIdAndRentMonth(req.getTenantId(), firstOfMonth)
                .orElseThrow(() -> new RuntimeException("No due found for this tenant and month. Generate dues first."));

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("This month is already fully paid.");
        }

        BigDecimal totalPaid = payment.getAmountPaid().add(req.getAmountPaid());
        BigDecimal balance   = payment.getRentAmount().subtract(totalPaid);

        if (totalPaid.compareTo(payment.getRentAmount()) > 0) {
            throw new RuntimeException("Amount exceeds rent due. Rent amount: ₹" + payment.getRentAmount());
        }

        payment.setAmountPaid(totalPaid);
        payment.setBalance(balance.max(BigDecimal.ZERO));
        payment.setPaymentDate(req.getPaymentDate());
        payment.setPaymentMode(req.getPaymentMode());
        payment.setTransactionId(req.getTransactionId());
        payment.setNote(req.getNote());

        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            payment.setStatus(PaymentStatus.PAID);
        } else {
            payment.setStatus(PaymentStatus.PARTIAL);
        }

        if (payment.getStatus() == PaymentStatus.PAID && payment.getReceiptNumber() == null) {
            payment.setReceiptNumber(generateReceiptNumber(payment));
        }

        RentPayment saved = paymentRepository.save(payment);

        // Send payment confirmation notification
        TenantServiceClient.TenantInfo tenant = tenantClient.getTenant(payment.getTenantId());
        if (tenant != null) {
            notificationClient.send(com.pgmanager.payment.client.NotificationServiceClient.NotificationRequest.builder()
                .tenantId(tenant.getId())
                .recipient(tenant.getEmail())
                .subject("Payment Received — " + tenant.getFullName())
                .message(String.format("₹%s received via %s for %s. Receipt #%s generated.", 
                        req.getAmountPaid(), req.getPaymentMode(), 
                        payment.getRentMonth().format(DateTimeFormatter.ofPattern("MMMM yyyy")),
                        saved.getReceiptNumber()))
                .type("BOTH")
                .build());
        }

        return toResponse(saved);
    }

    @Override
    public PaymentStatsResponse getStats(LocalDate month) {
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        BigDecimal collected  = paymentRepository.sumCollectedByMonth(firstOfMonth);
        BigDecimal outstanding = paymentRepository.sumOutstandingByMonth(firstOfMonth);
        long collectedCount   = paymentRepository.countByRentMonthAndStatus(firstOfMonth, PaymentStatus.PAID);
        long overdueCount     = paymentRepository.countByRentMonthAndStatus(firstOfMonth, PaymentStatus.OVERDUE);

        // Calculate Growth Rate
        LocalDate prevMonth = firstOfMonth.minusMonths(1);
        BigDecimal prevCollected = paymentRepository.sumCollectedByMonth(prevMonth);
        double growth = 0.0;
        if (prevCollected != null && prevCollected.compareTo(BigDecimal.ZERO) > 0) {
            growth = collected.subtract(prevCollected)
                    .divide(prevCollected, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")).doubleValue();
        }

        LocalDate today = LocalDate.now();
        LocalDate weekEnd = today.plusDays(7);
        List<RentPayment> dueThisWeek = paymentRepository.findDueThisWeek(
                firstOfMonth, today.getDayOfMonth(), weekEnd.getDayOfMonth());
        BigDecimal dueThisWeekAmt = dueThisWeek.stream()
                .map(RentPayment::getRentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal depositsHeld = tenantClient.getTotalDeposits();
        long depositsCount = tenantClient.getActiveTenantsCount();

        return PaymentStatsResponse.builder()
                .collected(collected)
                .collectedCount(collectedCount)
                .outstanding(outstanding)
                .overdueCount(overdueCount)
                .dueThisWeek(dueThisWeekAmt)
                .dueThisWeekCount(dueThisWeek.size())
                .depositsHeld(depositsHeld)
                .depositsCount(depositsCount)
                .growthRate(growth)
                .build();
    }

    @Override
    public List<PaymentResponse> getPaymentsByTenant(Long tenantId) {
        return paymentRepository.findByTenantIdOrderByRentMonthDesc(tenantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public int generateDues(LocalDate month) {
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        List<TenantServiceClient.TenantInfo> tenants = tenantClient.getActiveTenants();
        if (tenants == null) return 0;
        int count = 0;
        for (TenantServiceClient.TenantInfo t : tenants) {
            if (paymentRepository.findByTenantIdAndRentMonth(t.getId(), firstOfMonth).isPresent()) {
                continue;
            }
            RentPayment due = RentPayment.builder()
                    .tenantId(t.getId())
                    .tenantName(t.getFullName())
                    .roomId(t.getRoomId())
                    .roomNumber(t.getRoomNumber())
                    .rentMonth(firstOfMonth)
                    .rentAmount(t.getMonthlyRent())
                    .amountPaid(BigDecimal.ZERO)
                    .balance(t.getMonthlyRent())
                    .status(PaymentStatus.PENDING)
                    .build();
            paymentRepository.save(due);
            
            // Send rent due notification
            notificationClient.send(com.pgmanager.payment.client.NotificationServiceClient.NotificationRequest.builder()
                .tenantId(t.getId())
                .recipient(t.getEmail())
                .subject("Rent Due Reminder — " + t.getFullName())
                .message(String.format("Rent of ₹%s for %s is now due. Please pay by the 5th to avoid late fees.", 
                        t.getMonthlyRent(), firstOfMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy"))))
                .type("BOTH")
                .build());
                
            count++;
        }
        return count;
    }

    @Override
    public void generateDueForTenant(Long tenantId, LocalDate month) {
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        if (paymentRepository.findByTenantIdAndRentMonth(tenantId, firstOfMonth).isPresent()) {
            return;
        }
        TenantServiceClient.TenantInfo t = tenantClient.getTenant(tenantId);
        if (t == null) return;

        RentPayment due = RentPayment.builder()
                .tenantId(t.getId())
                .tenantName(t.getFullName())
                .roomId(t.getRoomId())
                .roomNumber(t.getRoomNumber())
                .rentMonth(firstOfMonth)
                .rentAmount(t.getMonthlyRent())
                .amountPaid(BigDecimal.ZERO)
                .balance(t.getMonthlyRent())
                .status(PaymentStatus.PENDING)
                .build();
        paymentRepository.save(due);

        // Send rent due notification
        notificationClient.send(com.pgmanager.payment.client.NotificationServiceClient.NotificationRequest.builder()
            .tenantId(t.getId())
            .recipient(t.getEmail())
            .subject("Rent Due Reminder — " + t.getFullName())
            .message(String.format("Rent of ₹%s for %s is now due.", 
                    t.getMonthlyRent(), firstOfMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy"))))
            .type("BOTH")
            .build());
    }

    @Override
    public byte[] generateReceipt(Long paymentId) {
        RentPayment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer   = new PdfWriter(baos);
        PdfDocument pdf    = new PdfDocument(writer);
        Document document  = new Document(pdf);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMMM yyyy");
        
        // Modern Color Palette
        com.itextpdf.kernel.colors.DeviceRgb slate800 = new com.itextpdf.kernel.colors.DeviceRgb(30, 41, 59);
        com.itextpdf.kernel.colors.DeviceRgb slate500 = new com.itextpdf.kernel.colors.DeviceRgb(100, 116, 139);
        com.itextpdf.kernel.colors.DeviceRgb slate50  = new com.itextpdf.kernel.colors.DeviceRgb(248, 250, 252);
        com.itextpdf.kernel.colors.DeviceRgb emerald  = new com.itextpdf.kernel.colors.DeviceRgb(16, 185, 129);

        // 1. Top Header Bar (Branding)
        Table headerBar = new Table(1).useAllAvailableWidth();
        headerBar.setBackgroundColor(slate800);
        headerBar.addCell(new Cell().add(new Paragraph("PG MANAGER").setFontSize(14).setBold().setFontColor(ColorConstants.WHITE).setMarginLeft(20))
                .setPaddingTop(15).setPaddingBottom(15).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        document.add(headerBar);

        // 2. Receipt Info (Right Aligned)
        Paragraph receiptTitle = new Paragraph("OFFICIAL RENT RECEIPT")
                .setFontSize(10).setBold().setFontColor(slate500)
                .setTextAlignment(TextAlignment.RIGHT).setMarginTop(20);
        document.add(receiptTitle);

        // 3. Hero Section: Amount & Status
        Table hero = new Table(2).useAllAvailableWidth().setMarginTop(20);
        
        // Amount with currency symbol
        Cell amountCell = new Cell().add(new Paragraph("₹ " + p.getAmountPaid().setScale(2))
                .setFontSize(32).setBold().setFontColor(slate800))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER);
        
        // Status Stamp
        Cell statusCell = new Cell().add(new Paragraph("PAID")
                .setFontSize(12).setBold().setFontColor(ColorConstants.WHITE)
                .setPaddingLeft(20).setPaddingRight(20).setPaddingTop(5).setPaddingBottom(5)
                .setBackgroundColor(emerald))
                .setTextAlignment(TextAlignment.RIGHT).setVerticalAlignment(com.itextpdf.layout.properties.VerticalAlignment.MIDDLE)
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER);
        
        hero.addCell(amountCell);
        hero.addCell(statusCell);
        document.add(hero);

        document.add(new Paragraph("Generated for " + p.getRentMonth().format(DateTimeFormatter.ofPattern("MMMM yyyy")) + " Rent")
                .setFontSize(11).setFontColor(slate500).setMarginBottom(40));

        // 4. Details Section (Modern Grid)
        Table details = new Table(2).useAllAvailableWidth();
        details.setBackgroundColor(slate50);
        details.setPadding(20);
        
        addPremiumRow(details, "TENANT DETAILS", p.getTenantName(), slate500, slate800);
        addPremiumRow(details, "ROOM INFORMATION", "Room " + p.getRoomNumber(), slate500, slate800);
        addPremiumRow(details, "PAYMENT METHOD", p.getPaymentMode() != null ? p.getPaymentMode().name() : "CASH", slate500, slate800);
        addPremiumRow(details, "TRANSACTION REF", p.getTransactionId() != null ? p.getTransactionId() : "N/A", slate500, slate800);
        addPremiumRow(details, "DATE OF PAYMENT", p.getPaymentDate() != null ? p.getPaymentDate().format(fmt) : "-", slate500, slate800);
        
        document.add(details);

        // 5. Footer with Disclaimer
        document.add(new Paragraph("\n\n\n\n"));
        document.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(0.5f)).setOpacity(0.1f));
        
        Table footer = new Table(2).useAllAvailableWidth().setMarginTop(10);
        footer.addCell(new Cell().add(new Paragraph("Receipt No: " + (p.getReceiptNumber() != null ? p.getReceiptNumber() : "N/A"))
                .setFontSize(8).setFontColor(slate500))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        
        footer.addCell(new Cell().add(new Paragraph("Thank you for staying with us!")
                .setFontSize(8).setItalic().setFontColor(slate500).setTextAlignment(TextAlignment.RIGHT))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        
        document.add(footer);
        
        document.add(new Paragraph("This is a digitally generated receipt. No physical signature required.")
                .setFontSize(7).setFontColor(slate500).setTextAlignment(TextAlignment.CENTER).setMarginTop(20));

        document.close();
        return baos.toByteArray();
    }

    private void addPremiumRow(Table table, String label, String value, com.itextpdf.kernel.colors.DeviceRgb labelCol, com.itextpdf.kernel.colors.DeviceRgb valCol) {
        table.addCell(new Cell().add(new Paragraph(label).setFontSize(7).setBold().setFontColor(labelCol).setCharacterSpacing(1f))
                .setPaddingLeft(20).setPaddingTop(15).setPaddingBottom(15).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(new com.itextpdf.kernel.colors.DeviceRgb(241, 245, 249), 1f)));
        
        table.addCell(new Cell().add(new Paragraph(value).setFontSize(10).setBold().setFontColor(valCol))
                .setPaddingRight(20).setPaddingTop(15).setPaddingBottom(15).setTextAlignment(TextAlignment.RIGHT).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(new com.itextpdf.kernel.colors.DeviceRgb(241, 245, 249), 1f)));
    }

    private void addRow(Table table, String label, String value) {
        // (This old method is no longer used but kept for internal calls if any)
        table.addCell(new Cell().add(new Paragraph(label).setBold().setFontSize(10)));
        table.addCell(new Cell().add(new Paragraph(value).setFontSize(10)));
    }

    private String generateReceiptNumber(RentPayment p) {
        int year = p.getRentMonth().getYear();
        long seq = paymentRepository.count();
        return String.format("RCP-%d-%04d", year, seq);
    }

    private void refreshOverdueStatus(RentPayment p) {
        if (p.getStatus() == PaymentStatus.PENDING) {
            LocalDate today   = LocalDate.now();
            LocalDate dueDate = p.getRentMonth().withDayOfMonth(Math.min(28, p.getRentMonth().lengthOfMonth()));
            if (today.isAfter(dueDate)) {
                p.setStatus(PaymentStatus.OVERDUE);
                paymentRepository.save(p);
            }
        }
    }

    PaymentResponse toResponse(RentPayment p) {
        boolean isOverdue = p.getStatus() == PaymentStatus.OVERDUE;
        return PaymentResponse.builder()
                .id(p.getId())
                .tenantId(p.getTenantId())
                .tenantName(p.getTenantName())
                .roomId(p.getRoomId())
                .roomNumber(p.getRoomNumber())
                .rentMonth(p.getRentMonth())
                .rentAmount(p.getRentAmount())
                .amountPaid(p.getAmountPaid())
                .balance(p.getBalance())
                .paymentDate(p.getPaymentDate())
                .paymentMode(p.getPaymentMode())
                .transactionId(p.getTransactionId())
                .note(p.getNote())
                .status(p.getStatus())
                .receiptNumber(p.getReceiptNumber())
                .isOverdue(isOverdue)
                .build();
    }
}
