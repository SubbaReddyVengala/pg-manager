package com.pgmanager.api.tenant.service;

import com.pgmanager.api.tenant.client.RoomServiceClient;
import com.pgmanager.api.tenant.client.PaymentServiceClient;
import com.pgmanager.api.tenant.dto.*;
import com.pgmanager.api.tenant.entity.Tenant;
import com.pgmanager.api.tenant.enums.TenantStatus;
import com.pgmanager.api.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.*;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final PaymentServiceClient paymentClient;
    private final RoomServiceClient roomClient;

    @Override
    public TenantResponse createTenant(TenantRequest req) {
        Tenant t = new Tenant();
        t.setFullName(req.getFullName());
        t.setPhone(req.getPhone());
        t.setEmail(req.getEmail());
        t.setMonthlyRent(req.getMonthlyRent());
        t.setSecurityDeposit(req.getSecurityDeposit());
        t.setRentDueDay(req.getRentDueDay());
        t.setIdProofType(req.getIdProofType());
        t.setIdNumber(req.getIdNumber());
        t.setEmergencyContact(req.getEmergencyContact());
        t.setEmergencyPhone(req.getEmergencyPhone());
        t.setPermanentAddress(req.getPermanentAddress());
        
        if (req.getRoomId() != null) {
            String roomNumber = roomClient.getRoomNumber(req.getRoomId());
            t.setRoomId(req.getRoomId());
            t.setRoomNumber(roomNumber);
            t.setMoveInDate(req.getMoveInDate() != null ? req.getMoveInDate() : LocalDate.now());
            t.setStatus(TenantStatus.ACTIVE);
            roomClient.incrementOccupancy(req.getRoomId());
        } else {
            t.setStatus(TenantStatus.PENDING);
        }

        t = tenantRepository.save(t);

        // Handle initial finance
        if (t.getStatus() == TenantStatus.ACTIVE && t.getMonthlyRent() != null) {
            if (req.isRecordInitialPayment()) {
                paymentClient.recordInitialPayment(t.getId(), t.getMonthlyRent(), "Initial rent payment on joining");
            } else {
                // Just create the "Invoice" so it shows as PENDING in the Payments module
                paymentClient.generateDueForTenant(t.getId(), LocalDate.now().withDayOfMonth(1));
            }
        }

        return toResponse(t);
    }

    // ── Generate Agreement PDF ─────────────────────────────
    @Override
    public byte[] generateAgreement(Long id) {
        Tenant t = findById(id);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document doc = new Document(pdf);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMMM yyyy");

        DeviceRgb slate800 = new DeviceRgb(30, 41, 59);
        DeviceRgb slate500 = new DeviceRgb(100, 116, 139);
        DeviceRgb slate50  = new DeviceRgb(248, 250, 252);

        // 1. Header
        doc.add(new Paragraph("RENTAL AGREEMENT").setFontSize(18).setBold().setFontColor(slate800).setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph("PG Manager Residential Terms").setFontSize(10).setFontColor(slate500).setTextAlignment(TextAlignment.CENTER).setMarginBottom(30));

        // 2. Party Details
        doc.add(new Paragraph("PARTIES INVOLVED").setFontSize(9).setBold().setFontColor(slate500).setCharacterSpacing(1f));
        Table parties = new Table(UnitValue.createPointArray(new float[]{1, 1})).useAllAvailableWidth().setMarginBottom(20);
        parties.addCell(new Cell().add(new Paragraph("LANDLORD / OWNER\nSubbu's PG Hostel").setFontSize(10).setBold()).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        parties.addCell(new Cell().add(new Paragraph("TENANT\n" + t.getFullName()).setFontSize(10).setBold()).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT));
        doc.add(parties);

        // 3. Agreement Terms (Grid)
        doc.add(new Paragraph("RENTAL TERMS").setFontSize(9).setBold().setFontColor(slate500).setCharacterSpacing(1f));
        Table terms = new Table(2).useAllAvailableWidth().setBackgroundColor(slate50).setMarginBottom(30);
        addTermRow(terms, "Property / Room", "Room " + t.getRoomNumber(), slate500, slate800);
        addTermRow(terms, "Move-in Date", t.getMoveInDate().format(fmt), slate500, slate800);
        addTermRow(terms, "Monthly Rent", "₹ " + t.getMonthlyRent(), slate500, slate800);
        addTermRow(terms, "Security Deposit", "₹ " + t.getSecurityDeposit(), slate500, slate800);
        addTermRow(terms, "Rent Due Cycle", t.getRentDueDay() + "st of every month", slate500, slate800);
        doc.add(terms);

        // 4. PG Rules
        doc.add(new Paragraph("PG RULES & CONDITIONS").setFontSize(9).setBold().setFontColor(slate500).setCharacterSpacing(1f).setMarginBottom(10));
        com.itextpdf.layout.element.List list = new com.itextpdf.layout.element.List().setFontSize(9).setFontColor(slate800);
        list.add("1. Rent must be paid on or before the due date mentioned above.");
        list.add("2. Notice period for moving out is minimum 30 days.");
        list.add("3. Security deposit is refundable only after full clearance of dues.");
        list.add("4. Guests are not allowed after 10 PM without prior permission.");
        list.add("5. Smoking and alcohol are strictly prohibited within PG premises.");
        doc.add(list);

        // 5. Signatures
        doc.add(new Paragraph("\n\n\n\n"));
        Table sigs = new Table(2).useAllAvailableWidth().setMarginTop(50);
        sigs.addCell(new Cell().add(new Paragraph("__________________________\nOwner Signature").setFontSize(10)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        sigs.addCell(new Cell().add(new Paragraph("__________________________\nTenant Signature").setFontSize(10)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT));
        doc.add(sigs);

        doc.close();
        return baos.toByteArray();
    }

    private void addTermRow(Table table, String label, String value, DeviceRgb labelCol, DeviceRgb valCol) {
        table.addCell(new Cell().add(new Paragraph(label).setFontSize(8).setFontColor(labelCol))
                .setPadding(15).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(241, 245, 249), 1f)));
        table.addCell(new Cell().add(new Paragraph(value).setFontSize(10).setBold().setFontColor(valCol))
                .setPadding(15).setTextAlignment(TextAlignment.RIGHT).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(241, 245, 249), 1f)));
    }

    // ── Private Helpers ────────────────────────────────────
    @Override
    public Page<TenantResponse> getAllTenants(TenantStatus status, String search, Pageable pageable) {
        boolean hasStatus = status != null;
        boolean hasSearch = search != null && !search.isBlank();
        Page<Tenant> page;
        if (hasStatus && hasSearch) {
            page = tenantRepository.searchByStatus(status, search, pageable);
        } else if (hasStatus) {
            page = tenantRepository.findByStatus(status, pageable);
        } else if (hasSearch) {
            page = tenantRepository.search(search, pageable);
        } else {
            page = tenantRepository.findAll(pageable);
        }
        return page.map(this::toResponse);
    }

    // ── Get Tenant By ID (detail view) ─────────────────────
    @Override
    public TenantDetailResponse getTenantById(Long id) {
        Tenant t = findById(id);
        
        // Correct duration calculation using Period
        long months = 0;
        if (t.getMoveInDate() != null) {
            LocalDate end = (t.getMoveOutDate() != null) ? t.getMoveOutDate() : LocalDate.now();
            Period period = Period.between(t.getMoveInDate(), end);
            months = period.getYears() * 12L + period.getMonths();
        }

        // Fetch payment summary from payment-service
        PaymentServiceClient.TenantPaymentSummary summary = paymentClient.getTenantPaymentSummary(id);

        return TenantDetailResponse.builder()
                .id(t.getId())
                .fullName(t.getFullName())
                .phone(t.getPhone())
                .email(t.getEmail())
                .roomId(t.getRoomId())
                .roomNumber(t.getRoomNumber())
                .moveInDate(t.getMoveInDate())
                .moveOutDate(t.getMoveOutDate())
                .monthlyRent(t.getMonthlyRent())
                .securityDeposit(t.getSecurityDeposit())
                .rentDueDay(t.getRentDueDay())
                .idProofType(t.getIdProofType())
                .idNumber(t.getIdNumber())
                .emergencyContact(t.getEmergencyContact())
                .emergencyPhone(t.getEmergencyPhone())
                .permanentAddress(t.getPermanentAddress())
                .status(t.getStatus())
                .totalPaid(summary.getTotalPaid())
                .outstanding(summary.getOutstanding())
                .stayDurationMonths(months)
                .isGoodStanding(summary.getOutstanding().compareTo(BigDecimal.ZERO) <= 0)
                .build();
    }

    // ── Update Tenant ──────────────────────────────────────
    @Override
    public TenantResponse updateTenant(Long id, TenantRequest req) {
        Tenant t = findById(id);
        
        // Check if assigning room to a PENDING tenant for the first time
        boolean isAssigningRoom = t.getStatus() == TenantStatus.PENDING && req.getRoomId() != null;

        t.setFullName(req.getFullName());
        t.setPhone(req.getPhone());
        t.setEmail(req.getEmail());
        t.setMonthlyRent(req.getMonthlyRent());
        t.setSecurityDeposit(req.getSecurityDeposit());
        t.setRentDueDay(req.getRentDueDay());
        if (req.getIdProofType() != null) t.setIdProofType(req.getIdProofType());
        t.setIdNumber(req.getIdNumber());
        t.setEmergencyContact(req.getEmergencyContact());
        t.setEmergencyPhone(req.getEmergencyPhone());
        t.setPermanentAddress(req.getPermanentAddress());

        if (isAssigningRoom) {
            String roomNumber = roomClient.getRoomNumber(req.getRoomId());
            t.setRoomId(req.getRoomId());
            t.setRoomNumber(roomNumber);
            t.setMoveInDate(req.getMoveInDate() != null ? req.getMoveInDate() : LocalDate.now());
            t.setStatus(TenantStatus.ACTIVE);
            roomClient.incrementOccupancy(req.getRoomId());
        }

        t = tenantRepository.save(t);

        // Record initial payment if assigned and rent provided
        if (isAssigningRoom && t.getMonthlyRent() != null) {
            paymentClient.recordInitialPayment(t.getId(), t.getMonthlyRent(), "Initial rent payment on joining");
        }

        return toResponse(t);
    }

    // ── Delete Tenant ──────────────────────────────────────
    @Override
    public void deleteTenant(Long id) {
        Tenant t = findById(id);
        if (t.getStatus() == TenantStatus.ACTIVE) {
            throw new RuntimeException("Cannot delete an ACTIVE tenant. Please perform 'Move Out' first to clear room occupancy and dues.");
        }
        tenantRepository.delete(t);
    }

    // ── Assign Room to PENDING Tenant ──────────────────────
    @Override
    public TenantResponse assignRoom(Long id, AssignRoomRequest req) {
        Tenant t = findById(id);
        if (t.getStatus() != TenantStatus.PENDING) {
            throw new RuntimeException("Only PENDING tenants can be assigned a room.");
        }
        String roomNumber = roomClient.getRoomNumber(req.getRoomId());
        t.setRoomId(req.getRoomId());
        t.setRoomNumber(roomNumber);
        if (req.getMoveInDate() != null) t.setMoveInDate(req.getMoveInDate());
        if (req.getMonthlyRent() != null) t.setMonthlyRent(req.getMonthlyRent());
        if (req.getSecurityDeposit() != null) t.setSecurityDeposit(req.getSecurityDeposit());
        if (req.getRentDueDay() != null) t.setRentDueDay(req.getRentDueDay());
        t.setStatus(TenantStatus.ACTIVE);
        roomClient.incrementOccupancy(req.getRoomId());
        
        t = tenantRepository.save(t);

        // Record initial payment on assignment
        if (t.getMonthlyRent() != null) {
            paymentClient.recordInitialPayment(t.getId(), t.getMonthlyRent(), "Rent paid on joining day (assignment)");
        }

        return toResponse(t);
    }

    // ── Move Out ───────────────────────────────────────────
    @Override
    public TenantResponse moveOut(Long id, MoveOutRequest req) {
        Tenant t = findById(id);
        if (t.getStatus() != TenantStatus.ACTIVE) {
            throw new RuntimeException("Only ACTIVE tenants can move out.");
        }

        PaymentServiceClient.TenantPaymentSummary summary = paymentClient.getTenantPaymentSummary(id);
        if (summary.getOutstanding().compareTo(BigDecimal.ZERO) > 0) {
            throw new RuntimeException("Cannot move out — tenant has outstanding dues (₹" + summary.getOutstanding() + "). Clear all payments first.");
        }

        Long roomId = t.getRoomId();
        t.setMoveOutDate(req.getMoveOutDate() != null ? req.getMoveOutDate() : LocalDate.now());
        t.setStatus(TenantStatus.INACTIVE);
        t.setRoomId(null);

        if (roomId != null) {
            try {
                roomClient.decrementOccupancy(roomId);
            } catch (Exception e) {
                System.out.println("Warning: Could not update room occupancy for roomId: " + roomId);
            }
        }

        return toResponse(tenantRepository.save(t));
    }

    @Override
    public List<TenantResponse> getTenantsByRoom(Long roomId) {
        return tenantRepository.findByRoomIdAndStatusIn(roomId, List.of(TenantStatus.ACTIVE, TenantStatus.PENDING))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── Stats ──────────────────────────────────────────────
    @Override
    public TenantStatsResponse getStats() {
        LocalDate now   = LocalDate.now();
        LocalDate start = now.withDayOfMonth(1);
        LocalDate end   = now.withDayOfMonth(now.lengthOfMonth());
        return TenantStatsResponse.builder()
                .active(tenantRepository.countByStatus(TenantStatus.ACTIVE))
                .pending(tenantRepository.countByStatus(TenantStatus.PENDING))
                .inactive(tenantRepository.countByStatus(TenantStatus.INACTIVE))
                .moveOutsThisMonth(tenantRepository.countMoveOutsBetween(start, end))
                .build();
    }

    // ── Private Helpers ────────────────────────────────────
    private Tenant findById(Long id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found: " + id));
    }

    private TenantResponse toResponse(Tenant t) {
        boolean overdue = false;
        long daysOverdue = 0;

        if (t.getStatus() == TenantStatus.ACTIVE && t.getRentDueDay() != null) {
            LocalDate today = LocalDate.now();
            LocalDate dueDate = today.withDayOfMonth(Math.min(t.getRentDueDay(), today.lengthOfMonth()));

            if (today.isAfter(dueDate)) {
                PaymentServiceClient.TenantPaymentSummary summary = paymentClient.getTenantPaymentSummary(t.getId());
                if (summary.getOutstanding().compareTo(BigDecimal.ZERO) > 0) {
                    overdue = true;
                    daysOverdue = java.time.temporal.ChronoUnit.DAYS.between(dueDate, today);
                }
            }
        }
        return TenantResponse.builder()
                .id(t.getId())
                .fullName(t.getFullName())
                .email(t.getEmail())
                .phone(t.getPhone())
                .roomNumber(t.getRoomNumber())
                .roomId(t.getRoomId())
                .moveInDate(t.getMoveInDate())
                .monthlyRent(t.getMonthlyRent())
                .securityDeposit(t.getSecurityDeposit())
                .rentDueDay(t.getRentDueDay())
                .status(t.getStatus())
                .idProofType(t.getIdProofType())
                .isOverdue(overdue)
                .daysOverdue(daysOverdue)
                .build();
    }
}
