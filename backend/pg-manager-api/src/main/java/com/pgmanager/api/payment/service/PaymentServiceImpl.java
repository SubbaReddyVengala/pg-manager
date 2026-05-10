package com.pgmanager.api.payment.service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.pgmanager.common.util.SecurityUtils;
import com.pgmanager.api.payment.client.TenantServiceClient;
import com.pgmanager.api.payment.dto.*;
import com.pgmanager.api.payment.entity.RentPayment;
import com.pgmanager.common.enums.PaymentStatus;
import com.pgmanager.api.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
    private final com.pgmanager.api.payment.client.NotificationServiceClient notificationClient;

    @Override
    public Page<PaymentResponse> getPaymentsByMonth(LocalDate month, PaymentStatus status, String search, Pageable pageable) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        boolean hasSearch = search != null && !search.isBlank();
        Page<RentPayment> page;

        if (status != null && hasSearch) {
            page = paymentRepository.searchByOwnerAndMonthAndStatus(ownerId, firstOfMonth, status, search, pageable);
        } else if (status != null) {
            page = paymentRepository.findByOwnerIdAndRentMonthAndStatus(ownerId, firstOfMonth, status, pageable);
        } else if (hasSearch) {
            page = paymentRepository.searchByOwnerAndMonth(ownerId, firstOfMonth, search, pageable);
        } else {
            page = paymentRepository.findByOwnerIdAndRentMonth(ownerId, firstOfMonth, pageable);
        }

        page.getContent().forEach(this::refreshOverdueStatus);
        return page.map(this::toResponse);
    }

    @Override
    @Transactional
    public PaymentResponse recordPayment(PaymentRequest req) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        LocalDate firstOfMonth = req.getRentMonth().withDayOfMonth(1);
        RentPayment payment = paymentRepository
                .findByOwnerIdAndTenantIdAndRentMonth(ownerId, req.getTenantId(), firstOfMonth)
                .orElseThrow(() -> new RuntimeException("No due found for this tenant and month. Generate dues first."));

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("This month is already fully paid.");
        }

        BigDecimal totalPaid = payment.getAmountPaid().add(req.getAmountPaid());
        BigDecimal balance   = payment.getRentAmount().subtract(totalPaid);

        payment.setAmountPaid(totalPaid);
        payment.setBalance(balance.max(BigDecimal.ZERO));
        payment.setPaymentDate(req.getPaymentDate() != null ? req.getPaymentDate() : LocalDate.now());
        payment.setPaymentMode(req.getPaymentMode());
        payment.setTransactionId(req.getTransactionId());
        payment.setNote(req.getNote());

        if (payment.getBalance().compareTo(BigDecimal.ZERO) <= 0) {
            payment.setStatus(PaymentStatus.PAID);
        } else {
            payment.setStatus(PaymentStatus.PARTIAL);
        }

        if (payment.getStatus() == PaymentStatus.PAID && payment.getReceiptNumber() == null) {
            payment.setReceiptNumber(generateReceiptNumber(payment));
        }

        RentPayment saved = paymentRepository.save(payment);

        TenantServiceClient.TenantInfo tenant = tenantClient.getTenant(payment.getTenantId());
        if (tenant != null) {
            notificationClient.send(com.pgmanager.api.payment.client.NotificationServiceClient.NotificationRequest.builder()
                .tenantId(tenant.getId())
                .recipient(tenant.getEmail())
                .subject("Payment Received — " + tenant.getFullName())
                .message(String.format("₹%s received via %s for %s.", 
                        req.getAmountPaid(), req.getPaymentMode(), 
                        payment.getRentMonth().format(DateTimeFormatter.ofPattern("MMMM yyyy"))))
                .type("PAYMENT")
                .build());
        }

        return toResponse(saved);
    }

    @Override
    public PaymentStatsResponse getStats(LocalDate month) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        BigDecimal collected  = paymentRepository.sumCollectedByOwnerAndMonth(ownerId, firstOfMonth);
        BigDecimal outstanding = paymentRepository.sumOutstandingByOwnerAndMonth(ownerId, firstOfMonth);
        long collectedCount   = paymentRepository.countByOwnerIdAndRentMonthAndStatus(ownerId, firstOfMonth, PaymentStatus.PAID);
        long overdueCount     = paymentRepository.countByOwnerIdAndRentMonthAndStatus(ownerId, firstOfMonth, PaymentStatus.OVERDUE);

        LocalDate prevMonth = firstOfMonth.minusMonths(1);
        BigDecimal prevCollected = paymentRepository.sumCollectedByOwnerAndMonth(ownerId, prevMonth);
        double growth = 0.0;
        if (prevCollected != null && prevCollected.compareTo(BigDecimal.ZERO) > 0) {
            growth = collected.subtract(prevCollected)
                    .divide(prevCollected, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")).doubleValue();
        }

        List<RentPayment> dueThisWeek = paymentRepository.findDueThisWeekByOwner(ownerId, firstOfMonth);
        BigDecimal dueThisWeekAmt = dueThisWeek.stream()
                .map(RentPayment::getRentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal depositsHeld = tenantClient.getTotalDeposits(ownerId);
        long depositsCount = tenantClient.getActiveTenantsCount(ownerId);

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
        return paymentRepository.findByOwnerIdAndTenantIdOrderByRentMonthDesc(SecurityUtils.getCurrentOwnerId(), tenantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public int generateDues(LocalDate month) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        List<TenantServiceClient.TenantInfo> tenants = tenantClient.getActiveTenants(ownerId);
        if (tenants == null) return 0;
        int count = 0;
        for (TenantServiceClient.TenantInfo t : tenants) {
            if (paymentRepository.findByOwnerIdAndTenantIdAndRentMonth(ownerId, t.getId(), firstOfMonth).isPresent()) {
                continue;
            }
            RentPayment due = RentPayment.builder()
                    .ownerId(ownerId)
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
            
            notificationClient.send(com.pgmanager.api.payment.client.NotificationServiceClient.NotificationRequest.builder()
                .tenantId(t.getId())
                .recipient(t.getEmail())
                .subject("Rent Due — " + t.getFullName())
                .amount(t.getMonthlyRent())
                .message(String.format("Rent of ₹%s for %s is now due.", 
                        t.getMonthlyRent(), firstOfMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy"))))
                .type("OVERDUE")
                .build());
            count++;
        }
        return count;
    }

    @Override
    @Transactional
    public void generateDueForTenant(Long tenantId, LocalDate month) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        if (paymentRepository.findByOwnerIdAndTenantIdAndRentMonth(ownerId, tenantId, firstOfMonth).isPresent()) {
            return;
        }
        TenantServiceClient.TenantInfo t = tenantClient.getTenant(tenantId);
        if (t == null) return;

        RentPayment due = RentPayment.builder()
                .ownerId(ownerId)
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
    }

    @Override
    public byte[] generateReceipt(Long paymentId) {
        RentPayment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        validateOwner(p);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer   = new PdfWriter(baos);
        PdfDocument pdf    = new PdfDocument(writer);
        Document document  = new Document(pdf);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMMM yyyy");
        
        com.itextpdf.kernel.colors.DeviceRgb slate800 = new com.itextpdf.kernel.colors.DeviceRgb(30, 41, 59);
        com.itextpdf.kernel.colors.DeviceRgb slate500 = new com.itextpdf.kernel.colors.DeviceRgb(100, 116, 139);
        com.itextpdf.kernel.colors.DeviceRgb slate50  = new com.itextpdf.kernel.colors.DeviceRgb(248, 250, 252);
        com.itextpdf.kernel.colors.DeviceRgb emerald  = new com.itextpdf.kernel.colors.DeviceRgb(16, 185, 129);

        com.itextpdf.layout.element.Table headerBar = new com.itextpdf.layout.element.Table(1).useAllAvailableWidth().setBackgroundColor(slate800);
        headerBar.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("PG MANAGER").setFontSize(14).setBold().setFontColor(ColorConstants.WHITE).setMarginLeft(20))
                .setPaddingTop(15).setPaddingBottom(15).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        document.add(headerBar);

        com.itextpdf.layout.element.Table hero = new com.itextpdf.layout.element.Table(2).useAllAvailableWidth().setMarginTop(40);
        hero.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("₹ " + p.getAmountPaid().setScale(2)).setFontSize(32).setBold().setFontColor(slate800)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        hero.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph("PAID").setFontSize(12).setBold().setFontColor(ColorConstants.WHITE).setPadding(5).setBackgroundColor(emerald)).setTextAlignment(TextAlignment.RIGHT).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        document.add(hero);

        com.itextpdf.layout.element.Table details = new com.itextpdf.layout.element.Table(2).useAllAvailableWidth().setBackgroundColor(slate50).setMarginTop(30);
        addPremiumRow(details, "TENANT", p.getTenantName(), slate500, slate800);
        addPremiumRow(details, "ROOM", p.getRoomNumber(), slate500, slate800);
        addPremiumRow(details, "MONTH", p.getRentMonth().format(DateTimeFormatter.ofPattern("MMMM yyyy")), slate500, slate800);
        addPremiumRow(details, "DATE", p.getPaymentDate() != null ? p.getPaymentDate().format(fmt) : "-", slate500, slate800);
        document.add(details);

        document.close();
        return baos.toByteArray();
    }

    private void addPremiumRow(com.itextpdf.layout.element.Table table, String label, String value, com.itextpdf.kernel.colors.DeviceRgb labelCol, com.itextpdf.kernel.colors.DeviceRgb valCol) {
        table.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(label).setFontSize(7).setBold().setFontColor(labelCol)).setPadding(15).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        table.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(value).setFontSize(10).setBold().setFontColor(valCol)).setPadding(15).setTextAlignment(TextAlignment.RIGHT).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
    }

    private String generateReceiptNumber(RentPayment p) {
        return "RCP-" + System.currentTimeMillis();
    }

    private void refreshOverdueStatus(RentPayment p) {
        if (p.getStatus() == PaymentStatus.PENDING) {
            LocalDate today = LocalDate.now();
            if (today.isAfter(p.getRentMonth().withDayOfMonth(5))) {
                p.setStatus(PaymentStatus.OVERDUE);
                paymentRepository.save(p);
            }
        }
    }

    private void validateOwner(RentPayment p) {
        if (!p.getOwnerId().equals(SecurityUtils.getCurrentOwnerId())) {
            throw new RuntimeException("Unauthorized access to this payment");
        }
    }

    PaymentResponse toResponse(RentPayment p) {
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
                .isOverdue(p.getStatus() == PaymentStatus.OVERDUE)
                .build();
    }
}




