package com.pgmanager.api.tenant.service;

import com.pgmanager.common.util.SecurityUtils;
import com.pgmanager.api.tenant.client.RoomServiceClient;
import com.pgmanager.api.tenant.client.PaymentServiceClient;
import com.pgmanager.api.tenant.dto.*;
import com.pgmanager.api.tenant.entity.Tenant;
import com.pgmanager.common.enums.TenantStatus;
import com.pgmanager.api.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final PaymentServiceClient paymentClient;
    private final RoomServiceClient roomClient;
    private final com.pgmanager.api.auth.repository.OwnerProfileRepository ownerProfileRepository;
    private final com.pgmanager.api.auth.repository.UserActivityRepository userActivityRepository;

    @Override
    @Transactional
    public TenantResponse createTenant(TenantRequest req) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        
        long activeTenants = tenantRepository.countByOwnerIdAndStatus(ownerId, TenantStatus.ACTIVE);
        if (req.getRoomId() != null) {
            com.pgmanager.api.auth.entity.OwnerProfile profile = ownerProfileRepository.findByUserId(ownerId)
                    .orElse(com.pgmanager.api.auth.entity.OwnerProfile.builder().build());
            if (activeTenants >= profile.getMaxTenants()) {
                throw new RuntimeException("Active tenant limit reached (" + profile.getMaxTenants() + "). Contact admin to upgrade.");
            }
        }
        
        if (tenantRepository.existsByOwnerIdAndEmail(ownerId, req.getEmail())) {
            throw new RuntimeException("Email already registered: " + req.getEmail());
        }

        Tenant t = Tenant.builder()
                .ownerId(ownerId)
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .monthlyRent(req.getMonthlyRent())
                .securityDeposit(req.getSecurityDeposit())
                .rentDueDay(req.getRentDueDay())
                .idProofType(req.getIdProofType())
                .idNumber(req.getIdNumber())
                .emergencyContact(req.getEmergencyContact())
                .emergencyPhone(req.getEmergencyPhone())
                .permanentAddress(req.getPermanentAddress())
                .build();
        
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
        
        if (activeTenants == 0 && t.getStatus() == TenantStatus.ACTIVE) {
            userActivityRepository.save(com.pgmanager.api.auth.entity.UserActivity.builder()
                    .userId(ownerId).ownerId(ownerId).actionType("TENANT_ADDED")
                    .description("First tenant onboarded: " + t.getFullName())
                    .timestamp(java.time.LocalDateTime.now()).build());
        }

        if (t.getStatus() == TenantStatus.ACTIVE && t.getMonthlyRent() != null) {
            if (req.isRecordInitialPayment()) {
                paymentClient.recordInitialPayment(t.getId(), t.getMonthlyRent(), "Initial rent payment on joining");
            } else {
                paymentClient.generateDueForTenant(t.getId(), LocalDate.now().withDayOfMonth(1));
            }
        }

        return toResponse(t);
    }

    @Override
    public byte[] generateAgreement(Long id) {
        Tenant t = findById(id);
        validateOwner(t);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document doc = new Document(pdf);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMMM yyyy");

        DeviceRgb slate800 = new DeviceRgb(30, 41, 59);
        DeviceRgb slate600 = new DeviceRgb(71, 85, 105);
        DeviceRgb slate500 = new DeviceRgb(100, 116, 139);
        DeviceRgb slate50  = new DeviceRgb(248, 250, 252);
        DeviceRgb slate200 = new DeviceRgb(226, 232, 240);

        float borderMargin = 20;
        com.itextpdf.kernel.geom.Rectangle rect = new com.itextpdf.kernel.geom.Rectangle(borderMargin, borderMargin, 
                pdf.getDefaultPageSize().getWidth() - borderMargin * 2, 
                pdf.getDefaultPageSize().getHeight() - borderMargin * 2);
        com.itextpdf.kernel.pdf.canvas.PdfCanvas canvas = new com.itextpdf.kernel.pdf.canvas.PdfCanvas(pdf.addNewPage());
        canvas.setStrokeColor(slate200).setLineWidth(1f).rectangle(rect).stroke();

        doc.add(new Paragraph("RESIDENTIAL RENTAL AGREEMENT").setFontSize(22).setBold().setFontColor(slate800).setTextAlignment(TextAlignment.CENTER).setMarginTop(20));
        doc.add(new Paragraph("This document serves as a legally binding agreement between the Landlord and Tenant.").setFontSize(9).setFontColor(slate500).setTextAlignment(TextAlignment.CENTER).setMarginBottom(40));

        doc.add(new Paragraph("PARTIES INVOLVED").setFontSize(10).setBold().setFontColor(slate800).setCharacterSpacing(1.5f).setMarginBottom(10));
        Table parties = new Table(UnitValue.createPointArray(new float[]{1, 1})).useAllAvailableWidth().setMarginBottom(30);
        parties.addCell(new Cell().add(new Paragraph("LANDLORD / OWNER\n").setFontSize(8).setFontColor(slate500).setBold()
                .add(new Text("PG Manager Hostels").setFontSize(11).setFontColor(slate800))).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setPadding(10).setBackgroundColor(slate50));
        parties.addCell(new Cell().add(new Paragraph("TENANT\n").setFontSize(8).setFontColor(slate500).setBold()
                .add(new Text(t.getFullName()).setFontSize(11).setFontColor(slate800))).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT).setPadding(10).setBackgroundColor(slate50));
        doc.add(parties);

        doc.add(new Paragraph("RENTAL TERMS & CONDITIONS").setFontSize(10).setBold().setFontColor(slate800).setCharacterSpacing(1.5f).setMarginBottom(10));
        Table terms = new Table(2).useAllAvailableWidth().setMarginBottom(40);
        addPremiumTermRow(terms, "Property / Room", "Room " + t.getRoomNumber(), slate600, slate800);
        addPremiumTermRow(terms, "Move-in Date", t.getMoveInDate().format(fmt), slate600, slate800);
        addPremiumTermRow(terms, "Monthly Rent", "₹ " + t.getMonthlyRent(), slate600, slate800);
        addPremiumTermRow(terms, "Security Deposit", "₹ " + t.getSecurityDeposit(), slate600, slate800);
        addPremiumTermRow(terms, "Rent Due Cycle", t.getRentDueDay() + "st of every month", slate600, slate800);
        doc.add(terms);

        doc.add(new Paragraph("TERMS OF OCCUPANCY").setFontSize(10).setBold().setFontColor(slate800).setCharacterSpacing(1.5f).setMarginBottom(15));
        com.itextpdf.layout.element.List list = new com.itextpdf.layout.element.List().setFontSize(10).setFontColor(slate600).setSymbolIndent(10);
        list.add(new ListItem("The tenant agrees to pay the monthly rent on or before the due date."));
        list.add(new ListItem("A minimum notice period of 30 days is required prior to vacating the premises."));
        list.add(new ListItem("The security deposit is refundable only after all outstanding dues and damages are cleared."));
        list.add(new ListItem("Guests are restricted after 10:00 PM; overnight stay requires prior approval."));
        list.add(new ListItem("Consumption of illegal substances, smoking, and alcohol is strictly prohibited."));
        doc.add(list);

        Table sigs = new Table(2).useAllAvailableWidth().setMarginTop(80);
        sigs.addCell(new Cell().add(new Paragraph("__________________________\nLANDLORD SIGNATURE").setFontSize(9).setBold().setFontColor(slate500)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
        sigs.addCell(new Cell().add(new Paragraph("__________________________\nTENANT SIGNATURE").setFontSize(9).setBold().setFontColor(slate500)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT));
        doc.add(sigs);

        doc.close();
        return baos.toByteArray();
    }

    private void addPremiumTermRow(Table table, String label, String value, DeviceRgb labelCol, DeviceRgb valCol) {
        table.addCell(new Cell().add(new Paragraph(label).setFontSize(9).setFontColor(labelCol))
                .setPadding(12).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(241, 245, 249), 1f)));
        table.addCell(new Cell().add(new Paragraph(value).setFontSize(11).setBold().setFontColor(valCol))
                .setPadding(12).setTextAlignment(TextAlignment.RIGHT).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(241, 245, 249), 1f)));
    }

    @Override
    public Page<TenantResponse> getAllTenants(TenantStatus status, String search, Pageable pageable) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        boolean hasStatus = status != null;
        boolean hasSearch = search != null && !search.isBlank();
        Page<Tenant> page;
        if (hasStatus && hasSearch) {
            page = tenantRepository.searchByStatusAndOwner(ownerId, status, search, pageable);
        } else if (hasStatus) {
            page = tenantRepository.findByOwnerIdAndStatus(ownerId, status, pageable);
        } else if (hasSearch) {
            page = tenantRepository.searchByOwner(ownerId, search, pageable);
        } else {
            page = tenantRepository.findAllByOwnerId(ownerId, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    public TenantDetailResponse getTenantById(Long id) {
        Tenant t = findById(id);
        validateOwner(t);
        
        long months = 0;
        if (t.getMoveInDate() != null) {
            LocalDate end = (t.getMoveOutDate() != null) ? t.getMoveOutDate() : LocalDate.now();
            Period period = Period.between(t.getMoveInDate(), end);
            months = period.getYears() * 12L + period.getMonths();
        }

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

    @Override
    @Transactional
    public TenantResponse updateTenant(Long id, TenantRequest req) {
        Tenant t = findById(id);
        validateOwner(t);
        
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

        if (isAssigningRoom && t.getMonthlyRent() != null) {
            paymentClient.recordInitialPayment(t.getId(), t.getMonthlyRent(), "Initial rent payment on joining");
        }

        return toResponse(t);
    }

    @Override
    @Transactional
    public void deleteTenant(Long id) {
        Tenant t = findById(id);
        validateOwner(t);
        if (t.getStatus() == TenantStatus.ACTIVE) {
            throw new RuntimeException("Cannot delete an ACTIVE tenant. Please perform 'Move Out' first to clear room occupancy and dues.");
        }
        tenantRepository.delete(t);
    }

    @Override
    @Transactional
    public TenantResponse assignRoom(Long id, AssignRoomRequest req) {
        Tenant t = findById(id);
        validateOwner(t);
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

        if (t.getMonthlyRent() != null) {
            paymentClient.recordInitialPayment(t.getId(), t.getMonthlyRent(), "Rent paid on joining day (assignment)");
        }

        return toResponse(t);
    }

    @Override
    @Transactional
    public TenantResponse moveOut(Long id, MoveOutRequest req) {
        Tenant t = findById(id);
        validateOwner(t);
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
                // Silently log warning, don't block move-out
            }
        }

        return toResponse(tenantRepository.save(t));
    }

    @Override
    public long countActiveInMonth(Long ownerId, LocalDate start, LocalDate end) {
        return tenantRepository.countActiveInMonthByOwner(ownerId, start, end);
    }

    @Override
    public long countAllTenantsIgnoreOwner() {
        return tenantRepository.count();
    }

    @Override
    public List<TenantResponse> getTenantsByRoom(Long roomId) {
        return tenantRepository.findByOwnerIdAndRoomIdAndStatusIn(SecurityUtils.getCurrentOwnerId(), roomId, List.of(TenantStatus.ACTIVE, TenantStatus.PENDING))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public TenantStatsResponse getStats() {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        LocalDate now   = LocalDate.now();
        LocalDate start = now.withDayOfMonth(1);
        LocalDate end   = now.withDayOfMonth(now.lengthOfMonth());
        return TenantStatsResponse.builder()
                .active(tenantRepository.countByOwnerIdAndStatus(ownerId, TenantStatus.ACTIVE))
                .pending(tenantRepository.countByOwnerIdAndStatus(ownerId, TenantStatus.PENDING))
                .inactive(tenantRepository.countByOwnerIdAndStatus(ownerId, TenantStatus.INACTIVE))
                .moveOutsThisMonth(tenantRepository.countMoveOutsBetweenByOwner(ownerId, start, end))
                .build();
    }

    private void validateOwner(Tenant t) {
        Long currentOwnerId = SecurityUtils.getCurrentOwnerId();
        if (!t.getOwnerId().equals(currentOwnerId)) {
            throw new RuntimeException("Unauthorized: You do not own this tenant record.");
        }
    }

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




