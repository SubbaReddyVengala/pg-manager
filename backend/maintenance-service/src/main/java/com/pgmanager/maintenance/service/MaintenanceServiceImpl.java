package com.pgmanager.maintenance.service;

import com.pgmanager.maintenance.client.PaymentServiceClient;
import com.pgmanager.maintenance.dto.*;
import com.pgmanager.maintenance.entity.GeneralExpense;
import com.pgmanager.maintenance.entity.MaintenanceTicket;
import com.pgmanager.maintenance.enums.MaintenanceStatus;
import com.pgmanager.maintenance.mapper.MaintenanceMapper;
import com.pgmanager.maintenance.repository.GeneralExpenseRepository;
import com.pgmanager.maintenance.repository.MaintenanceTicketRepository;
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
    private final com.pgmanager.maintenance.client.NotificationServiceClient notificationClient;
    private final com.pgmanager.maintenance.client.RoomServiceClient roomServiceClient;

    @Override
    @Transactional
    public MaintenanceTicketResponse raiseTicket(MaintenanceTicketRequest req) {
        // Validate room exists
        if (!roomServiceClient.roomExists(req.getRoomNumber())) {
            throw new RuntimeException("Invalid Room: Room " + req.getRoomNumber() + " does not exist in the system.");
        }

        MaintenanceTicket ticket = MaintenanceTicket.builder()
                .roomId(req.getRoomId())
                .roomNumber(req.getRoomNumber())
                .tenantId(req.getTenantId())
                .tenantName(req.getTenantName())
                .description(req.getDescription())
                .priority(req.getPriority())
                .cost(req.getCost())
                .status(MaintenanceStatus.OPEN)
                .reportedAt(LocalDateTime.now())
                .build();
        
        MaintenanceTicket saved = ticketRepository.save(ticket);
        
        // Send notification to Owner/Admin
        notificationClient.send(com.pgmanager.maintenance.client.NotificationServiceClient.NotificationRequest.builder()
            .subject("New Maintenance Request — Room " + req.getRoomNumber())
            .message(String.format("%s reported: \"%s\". Priority: %s. Ticket #MNT-%03d created.", 
                    req.getTenantName(), req.getDescription(), req.getPriority(), saved.getId()))
            .type("BOTH")
            .tenantId(req.getTenantId())
            .build());

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public MaintenanceTicketResponse startWork(Long ticketId) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        ticket.setStatus(MaintenanceStatus.IN_PROGRESS);
        ticket.setStartedAt(LocalDateTime.now());
        return mapper.toResponse(ticketRepository.save(ticket));
    }

    @Override
    @Transactional
    public MaintenanceTicketResponse resolveTicket(Long ticketId, BigDecimal cost) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));
        ticket.setStatus(MaintenanceStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        if (cost != null) ticket.setCost(cost);
        return mapper.toResponse(ticketRepository.save(ticket));
    }

    @Override
    public List<MaintenanceTicketResponse> getTickets(MaintenanceStatus status) {
        List<MaintenanceTicket> tickets = (status != null) 
                ? ticketRepository.findByStatus(status) 
                : ticketRepository.findAll();
        return tickets.stream().map(mapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public MaintenanceStatsResponse getStats() {
        long open = ticketRepository.countByStatus(MaintenanceStatus.OPEN);
        long inProgress = ticketRepository.countByStatus(MaintenanceStatus.IN_PROGRESS);
        long resolved = ticketRepository.countByStatus(MaintenanceStatus.RESOLVED);
        Double avgDays = ticketRepository.getAverageResolutionTimeInDays();
        
        return MaintenanceStatsResponse.builder()
                .openCount(open)
                .inProgressCount(inProgress)
                .resolvedCount(resolved)
                .avgResolutionTime(avgDays != null ? String.format("%.1fd", avgDays) : "0.0d")
                .build();
    }

    @Override
    @Transactional
    public void recordExpense(GeneralExpenseRequest req) {
        if (req.getAmount() == null || req.getAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Expense amount must be greater than zero.");
        }
        GeneralExpense expense = GeneralExpense.builder()
                .category(req.getCategory())
                .description(req.getDescription())
                .amount(req.getAmount())
                .expenseDate(req.getExpenseDate())
                .note(req.getNote())
                .build();
        expenseRepository.save(expense);
    }

    @Override
    public List<GeneralExpense> getExpenses(LocalDate month) {
        LocalDate start = month.withDayOfMonth(1);
        LocalDate end = month.withDayOfMonth(month.lengthOfMonth());
        return expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDesc(start, end);
    }

    @Override
    public NetProfitResponse getNetProfit(LocalDate month) {
        LocalDate start = month.withDayOfMonth(1);
        LocalDate end = month.withDayOfMonth(month.lengthOfMonth());

        // Get revenue from payment-service
        BigDecimal revenue = paymentServiceClient.getMonthlyRevenue(start);
        if (revenue == null) revenue = BigDecimal.ZERO;

        // Get costs from maintenance-service itself
        BigDecimal generalExp = expenseRepository.sumExpensesBetween(start, end);
        if (generalExp == null) generalExp = BigDecimal.ZERO;

        // Sum ticket costs (assuming tickets resolved this month)
        BigDecimal ticketCosts = ticketRepository.findAll().stream()
                .filter(t -> t.getResolvedAt() != null && 
                             !t.getResolvedAt().toLocalDate().isBefore(start) && 
                             !t.getResolvedAt().toLocalDate().isAfter(end))
                .map(t -> t.getCost() != null ? t.getCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCost = generalExp.add(ticketCosts);
        BigDecimal profit = revenue.subtract(totalCost);

        return NetProfitResponse.builder()
                .month(start)
                .totalRevenue(revenue)
                .totalMaintenanceCost(ticketCosts)
                .totalGeneralExpenses(generalExp)
                .netProfit(profit)
                .build();
    }
}
