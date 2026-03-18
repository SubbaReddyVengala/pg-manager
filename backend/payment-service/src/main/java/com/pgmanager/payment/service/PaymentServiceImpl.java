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

    // ── Get payments for a month (with optional status filter) ───────────
    @Override
    public List<PaymentResponse> getPaymentsByMonth(LocalDate month, PaymentStatus status) {
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        List<RentPayment> payments = status != null
                ? paymentRepository.findByRentMonthAndStatus(firstOfMonth, status)
                : paymentRepository.findByRentMonth(firstOfMonth);
        // Refresh overdue status before returning
        payments.forEach(this::refreshOverdueStatus);
        return payments.stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Record a payment ─────────────────────────────────────────────────
    @Override
    public PaymentResponse recordPayment(PaymentRequest req) {
        LocalDate firstOfMonth = req.getRentMonth().withDayOfMonth(1);

        // Find existing due or throw
        RentPayment payment = paymentRepository
                .findByTenantIdAndRentMonth(req.getTenantId(), firstOfMonth)
                .orElseThrow(() -> new RuntimeException(
                        "No due found for this tenant and month. Generate dues first."));

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("This month is already fully paid.");
        }

        // Add to existing amount paid (supports multiple partial payments)
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

        // Set status based on amount paid
        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            payment.setStatus(PaymentStatus.PAID);
        } else {
            payment.setStatus(PaymentStatus.PARTIAL);
        }

        // Generate receipt number if fully paid
        if (payment.getStatus() == PaymentStatus.PAID && payment.getReceiptNumber() == null) {
            payment.setReceiptNumber(generateReceiptNumber(payment));
        }

        return toResponse(paymentRepository.save(payment));
    }

    // ── Stats for a month (4 stat cards in Screenshot 1) ─────────────────
    @Override
    public PaymentStatsResponse getStats(LocalDate month) {
        LocalDate firstOfMonth = month.withDayOfMonth(1);

        BigDecimal collected  = paymentRepository.sumCollectedByMonth(firstOfMonth);
        BigDecimal outstanding = paymentRepository.sumOutstandingByMonth(firstOfMonth);
        long collectedCount   = paymentRepository.countByRentMonthAndStatus(firstOfMonth, PaymentStatus.PAID);
        long overdueCount     = paymentRepository.countByRentMonthAndStatus(firstOfMonth, PaymentStatus.OVERDUE);

        // Due this week calculation
        LocalDate today = LocalDate.now();
        LocalDate weekEnd = today.plusDays(7);
        List<RentPayment> dueThisWeek = paymentRepository.findDueThisWeek(
                firstOfMonth, today.getDayOfMonth(), weekEnd.getDayOfMonth());
        BigDecimal dueThisWeekAmt = dueThisWeek.stream()
                .map(RentPayment::getRentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Deposits held = sum of security deposits of all active tenants
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
                .build();
    }

    // ── Payment history for a tenant (detail page) ───────────────────────
    @Override
    public List<PaymentResponse> getPaymentsByTenant(Long tenantId) {
        return paymentRepository.findByTenantIdOrderByRentMonthDesc(tenantId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Generate dues for all active tenants for a given month ───────────
    @Override
    public int generateDues(LocalDate month) {
        LocalDate firstOfMonth = month.withDayOfMonth(1);
        List<TenantServiceClient.TenantInfo> tenants = tenantClient.getActiveTenants();
        if (tenants == null) return 0;
        int count = 0;
        for (TenantServiceClient.TenantInfo t : tenants) {
            // Idempotency — skip if already generated
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
            count++;
        }
        return count;
    }

    // ── Generate PDF Receipt (iText7) ────────────────────────────────────
    @Override
    public byte[] generateReceipt(Long paymentId) {
        RentPayment p = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer   = new PdfWriter(baos);
        PdfDocument pdf    = new PdfDocument(writer);
        Document document  = new Document(pdf);

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMMM yyyy");

        // Header
        document.add(new Paragraph("PG MANAGER")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(14).setBold().setFontColor(ColorConstants.DARK_GRAY));
        document.add(new Paragraph("Rent Receipt")
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(12).setBold());

        // Amount
        document.add(new Paragraph("\u20B9" + p.getAmountPaid())
                .setTextAlignment(TextAlignment.CENTER)
                .setFontSize(28).setBold().setFontColor(ColorConstants.GREEN));

        document.add(new Paragraph("\n"));

        // Details table
        Table table = new Table(2).useAllAvailableWidth();
        addRow(table, "Tenant",  p.getTenantName());
        addRow(table, "Room",    p.getRoomNumber());
        addRow(table, "Month",   p.getRentMonth().format(DateTimeFormatter.ofPattern("MMMM yyyy")));
        addRow(table, "Paid On", p.getPaymentDate() != null ? p.getPaymentDate().format(fmt) : "-");
        addRow(table, "Mode",    p.getPaymentMode() != null ? p.getPaymentMode().name() : "-");
        addRow(table, "Txn ID",  p.getTransactionId() != null ? p.getTransactionId() : "-");
        document.add(table);

        // Footer
        document.add(new Paragraph("\n"));
        document.add(new Paragraph(
                (p.getReceiptNumber() != null ? p.getReceiptNumber() : "") +
                        "  |  PG Manager System")
                .setTextAlignment(TextAlignment.CENTER).setFontSize(9)
                .setFontColor(ColorConstants.GRAY));
        document.add(new Paragraph("This is a computer generated receipt.")
                .setTextAlignment(TextAlignment.CENTER).setFontSize(9)
                .setFontColor(ColorConstants.GRAY));

        document.close();
        return baos.toByteArray();
    }

    // ── Private Helpers ───────────────────────────────────────────────────
    private void addRow(Table table, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setBold().setFontSize(10)));
        table.addCell(new Cell().add(new Paragraph(value).setFontSize(10)));
    }

    private String generateReceiptNumber(RentPayment p) {
        int year = p.getRentMonth().getYear();
        long seq = paymentRepository.count(); // simple sequence
        return String.format("RCP-%d-%04d", year, seq);
    }

    private void refreshOverdueStatus(RentPayment p) {
        if (p.getStatus() == PaymentStatus.PENDING) {
            LocalDate today   = LocalDate.now();
            LocalDate dueDate = p.getRentMonth().withDayOfMonth(
                    Math.min(28, p.getRentMonth().lengthOfMonth()));
            if (today.isAfter(dueDate)) {
                p.setStatus(PaymentStatus.OVERDUE);
                paymentRepository.save(p);
            }
        }
    }

    private PaymentResponse toResponse(RentPayment p) {
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
