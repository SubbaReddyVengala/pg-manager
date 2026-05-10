package com.pgmanager.api.maintenance.service;

import com.pgmanager.common.util.SecurityUtils;
import com.pgmanager.api.maintenance.client.PaymentServiceClient;
import com.pgmanager.api.maintenance.client.RoomServiceClient;
import com.pgmanager.api.maintenance.dto.NetProfitResponse;
import com.pgmanager.api.maintenance.entity.MaintenanceTicket;
import com.pgmanager.common.enums.MaintenanceStatus;
import com.pgmanager.api.maintenance.repository.GeneralExpenseRepository;
import com.pgmanager.api.maintenance.repository.MaintenanceTicketRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MaintenanceServiceTest {

    @Mock private MaintenanceTicketRepository ticketRepository;
    @Mock private GeneralExpenseRepository expenseRepository;
    @Mock private PaymentServiceClient paymentServiceClient;
    @Mock private RoomServiceClient roomServiceClient;

    @InjectMocks
    private MaintenanceServiceImpl maintenanceService;

    private MockedStatic<SecurityUtils> securityUtils;
    private Long ownerId = 1L;

    @BeforeEach
    void setUp() {
        securityUtils = mockStatic(SecurityUtils.class);
        securityUtils.when(SecurityUtils::getCurrentOwnerId).thenReturn(ownerId);
    }

    @AfterEach
    void tearDown() {
        securityUtils.close();
    }

    @Test
    void getNetProfit_Calculation_Correct() {
        // Given
        LocalDate month = LocalDate.now().withDayOfMonth(1);
        LocalDate start = month;
        LocalDate end = month.withDayOfMonth(month.lengthOfMonth());

        when(paymentServiceClient.getMonthlyRevenue(start)).thenReturn(new BigDecimal("10000"));
        when(expenseRepository.sumExpensesBetweenByOwner(ownerId, start, end)).thenReturn(new BigDecimal("2000"));
        
        MaintenanceTicket resolvedTicket = MaintenanceTicket.builder()
                .status(MaintenanceStatus.RESOLVED)
                .cost(new BigDecimal("500"))
                .resolvedAt(LocalDateTime.now())
                .build();
        when(ticketRepository.findByOwnerIdAndStatus(ownerId, MaintenanceStatus.RESOLVED))
                .thenReturn(List.of(resolvedTicket));

        // When
        NetProfitResponse response = maintenanceService.getNetProfit(month);

        // Then
        assertNotNull(response);
        assertEquals(new BigDecimal("10000"), response.getTotalRevenue());
        assertEquals(new BigDecimal("2000"), response.getTotalGeneralExpenses());
        assertEquals(new BigDecimal("500"), response.getTotalMaintenanceCost());
        assertEquals(new BigDecimal("7500"), response.getNetProfit());
    }
}
