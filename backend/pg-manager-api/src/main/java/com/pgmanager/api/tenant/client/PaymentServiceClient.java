package com.pgmanager.api.tenant.client;

import com.pgmanager.api.payment.dto.PaymentRequest;
import com.pgmanager.api.payment.dto.PaymentResponse;
import com.pgmanager.common.enums.PaymentMode;
import com.pgmanager.api.payment.service.PaymentService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component("tenantPaymentServiceClient")
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceClient {

    private final PaymentService paymentService;

    public void recordInitialPayment(Long tenantId, BigDecimal amount, String note) {
        try {
            LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
            
            // Generate due for ONLY this tenant
            paymentService.generateDueForTenant(tenantId, currentMonth);

            // Now record the payment
            PaymentRequest req = PaymentRequest.builder()
                    .tenantId(tenantId)
                    .rentMonth(currentMonth)
                    .amountPaid(amount)
                    .paymentDate(LocalDate.now())
                    .paymentMode(PaymentMode.CASH)
                    .note(note)
                    .build();

            paymentService.recordPayment(req);
        } catch (Exception e) {
            log.error("Failed to record initial payment for tenant {}: {}", tenantId, e.getMessage());
        }
    }

    public void generateDueForTenant(Long tenantId, LocalDate month) {
        try {
            paymentService.generateDueForTenant(tenantId, month);
        } catch (Exception e) {
            log.error("Failed to generate due for tenant {}: {}", tenantId, e.getMessage());
        }
    }

    public TenantPaymentSummary getTenantPaymentSummary(Long tenantId) {
        try {
            List<PaymentResponse> responses = paymentService.getPaymentsByTenant(tenantId);
            
            BigDecimal totalPaid = BigDecimal.ZERO;
            BigDecimal outstanding = BigDecimal.ZERO;
            
            if (responses != null) {
                for (PaymentResponse res : responses) {
                    if (res.getAmountPaid() != null) {
                        totalPaid = totalPaid.add(res.getAmountPaid());
                    }
                    if (res.getBalance() != null) {
                        outstanding = outstanding.add(res.getBalance());
                    }
                }
            }
            return new TenantPaymentSummary(totalPaid, outstanding);
        } catch (Exception e) {
            log.error("Failed to fetch payment summary for tenant {}: {}", tenantId, e.getMessage());
            return new TenantPaymentSummary(BigDecimal.ZERO, BigDecimal.ZERO);
        }
    }

    @Data @RequiredArgsConstructor
    public static class TenantPaymentSummary {
        private final BigDecimal totalPaid;
        private final BigDecimal outstanding;
    }
}




