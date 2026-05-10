package com.pgmanager.api.maintenance.service;

import com.pgmanager.common.util.SecurityUtils;
import com.pgmanager.api.maintenance.client.PaymentServiceClient;
import com.pgmanager.api.maintenance.dto.*;
import com.pgmanager.api.maintenance.entity.GeneralExpense;
import com.pgmanager.api.maintenance.entity.MaintenanceTicket;
import com.pgmanager.common.enums.MaintenanceStatus;
import com.pgmanager.api.maintenance.mapper.MaintenanceMapper;
import com.pgmanager.api.maintenance.repository.GeneralExpenseRepository;
import com.pgmanager.api.maintenance.repository.MaintenanceTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceTicketRepository ticketRepository;
    private final GeneralExpenseRepository expenseRepository;
    private final MaintenanceMapper mapper;
    private final PaymentServiceClient paymentServiceClient;
    private final com.pgmanager.api.maintenance.client.NotificationServiceClient notificationClient;
    private final com.pgmanager.api.maintenance.client.RoomServiceClient roomServiceClient;

    @Override
    @Transactional
    public MaintenanceTicketResponse raiseTicket(MaintenanceTicketRequest req) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        
        if (!roomServiceClient.roomExists(req.getRoomNumber())) {
            throw new RuntimeException("Invalid Room: Room " + req.getRoomNumber() + " does not exist.");
        }

        MaintenanceTicket ticket = MaintenanceTicket.builder()
                .ownerId(ownerId)
                .roomId(req.getRoomId())
                .roomNumber(req.getRoomNumber())
                .tenantId(req.getTenantId())
                .tenantName(req.getTenantName())
                .description(req.getDescription())
                .priority(req.getPriority())
                .cost(req.getCost() != null ? req.getCost() : BigDecimal.ZERO)
                .status(MaintenanceStatus.OPEN)
                .reportedAt(LocalDateTime.now())
                .build();
        
        MaintenanceTicket saved = ticketRepository.save(ticket);
        
        notificationClient.send(com.pgmanager.api.maintenance.client.NotificationServiceClient.NotificationRequest.builder()
            .subject("New Maintenance Request — Room " + req.getRoomNumber())
            .message(String.format("%s reported: \"%s\".", req.getTenantName(), req.getDescription()))
            .type("MAINTENANCE")
            .tenantId(req.getTenantId())
            .build());

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public MaintenanceTicketResponse startWork(Long ticketId) {
        MaintenanceTicket ticket = findById(ticketId);
        validateOwner(ticket);
        ticket.setStatus(MaintenanceStatus.IN_PROGRESS);
        ticket.setStartedAt(LocalDateTime.now());
        return mapper.toResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public MaintenanceTicketResponse resolveTicket(Long ticketId, BigDecimal cost) {
        MaintenanceTicket ticket = findById(ticketId);
        validateOwner(ticket);
        ticket.setStatus(MaintenanceStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        if (cost != null) ticket.setCost(cost);
        return mapper.toResponse(ticketRepository.save(ticket));
    }

    @Override
    public List<MaintenanceTicketResponse> getTickets(MaintenanceStatus status) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        List<MaintenanceTicket> tickets = (status != null) 
                ? ticketRepository.findByOwnerIdAndStatus(ownerId, status) 
                : ticketRepository.findByOwnerId(ownerId);
        return tickets.stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public MaintenanceStatsResponse getStats() {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        Double avgDays = ticketRepository.getAverageResolutionTimeInDaysByOwner(ownerId);
        
        return MaintenanceStatsResponse.builder()
                .openCount(ticketRepository.countByOwnerIdAndStatus(ownerId, MaintenanceStatus.OPEN))
                .inProgressCount(ticketRepository.countByOwnerIdAndStatus(ownerId, MaintenanceStatus.IN_PROGRESS))
                .resolvedCount(ticketRepository.countByOwnerIdAndStatus(ownerId, MaintenanceStatus.RESOLVED))
                .avgResolutionTime(avgDays != null ? String.format("%.1fd", avgDays) : "0.0d")
                .build();
    }

    @Override
    @Transactional
    public void recordExpense(GeneralExpenseRequest req) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        GeneralExpense expense = GeneralExpense.builder()
                .ownerId(ownerId)
                .category(req.getCategory())
                .description(req.getDescription())
                .amount(req.getAmount())
                .expenseDate(req.getExpenseDate())
                .note(req.getNote())
                .build();
        expenseRepository.save(expense);
    }

    @Override
    @Transactional
    public void deleteTicket(Long ticketId) {
        MaintenanceTicket ticket = findById(ticketId);
        validateOwner(ticket);
        ticketRepository.delete(ticket);
    }

    @Override
    public List<GeneralExpense> getExpenses(LocalDate month) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        LocalDate start = month.withDayOfMonth(1);
        LocalDate end = month.withDayOfMonth(month.lengthOfMonth());
        return expenseRepository.findByOwnerIdAndExpenseDateBetweenOrderByExpenseDateDesc(ownerId, start, end);
    }

    @Override
    public NetProfitResponse getNetProfit(LocalDate month) {
        Long ownerId = SecurityUtils.getCurrentOwnerId();
        LocalDate start = month.withDayOfMonth(1);
        LocalDate end = month.withDayOfMonth(month.lengthOfMonth());

        BigDecimal revenue = paymentServiceClient.getMonthlyRevenue(start);
        BigDecimal generalExp = expenseRepository.sumExpensesBetweenByOwner(ownerId, start, end);
        if (generalExp == null) generalExp = BigDecimal.ZERO;

        BigDecimal ticketCosts = ticketRepository.findByOwnerIdAndStatus(ownerId, MaintenanceStatus.RESOLVED).stream()
                .filter(t -> t.getResolvedAt() != null && 
                             !t.getResolvedAt().toLocalDate().isBefore(start) && 
                             !t.getResolvedAt().toLocalDate().isAfter(end))
                .map(t -> t.getCost() != null ? t.getCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal profit = (revenue != null ? revenue : BigDecimal.ZERO).subtract(generalExp).subtract(ticketCosts);

        return NetProfitResponse.builder()
                .month(start)
                .totalRevenue(revenue != null ? revenue : BigDecimal.ZERO)
                .totalMaintenanceCost(ticketCosts)
                .totalGeneralExpenses(generalExp)
                .netProfit(profit)
                .build();
    }

    private MaintenanceTicket findById(Long id) {
        return ticketRepository.findById(id).orElseThrow(() -> new RuntimeException("Ticket not found"));
    }

    private void validateOwner(MaintenanceTicket t) {
        if (!t.getOwnerId().equals(SecurityUtils.getCurrentOwnerId())) {
            throw new RuntimeException("Unauthorized access to this ticket");
        }
    }
}




