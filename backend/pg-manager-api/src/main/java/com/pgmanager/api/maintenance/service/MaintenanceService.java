package com.pgmanager.api.maintenance.service;

import com.pgmanager.api.maintenance.dto.*;
import com.pgmanager.api.maintenance.entity.GeneralExpense;
import com.pgmanager.common.enums.MaintenanceStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface MaintenanceService {
    MaintenanceTicketResponse raiseTicket(MaintenanceTicketRequest req);
    MaintenanceTicketResponse startWork(Long ticketId);
    MaintenanceTicketResponse resolveTicket(Long ticketId, BigDecimal cost);
    List<MaintenanceTicketResponse> getTickets(MaintenanceStatus status);
    MaintenanceStatsResponse getStats();
    void deleteTicket(Long ticketId);
    
    void recordExpense(GeneralExpenseRequest req);
    List<GeneralExpense> getExpenses(LocalDate month);
    NetProfitResponse getNetProfit(LocalDate month);
}




