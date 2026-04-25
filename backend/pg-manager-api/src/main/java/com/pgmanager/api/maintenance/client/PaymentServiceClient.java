package com.pgmanager.api.maintenance.client;

import com.pgmanager.api.payment.dto.PaymentStatsResponse;
import com.pgmanager.api.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;

@Component("maintenancePaymentServiceClient")
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceClient {

    private final PaymentService paymentService;

    public BigDecimal getMonthlyRevenue(LocalDate month) {
        try {
            PaymentStatsResponse stats = paymentService.getStats(month);
            return stats.getCollected() != null ? stats.getCollected() : BigDecimal.ZERO;
        } catch (Exception e) {
            log.error("Failed to fetch revenue from payment-service: {}", e.getMessage());
        }
        return BigDecimal.ZERO;
    }
}
