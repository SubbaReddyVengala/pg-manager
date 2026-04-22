package com.pgmanager.tenant.client;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class PaymentServiceClient {

    private final RestTemplate restTemplate;

    @Value("${payment-service.url}")
    private String paymentServiceUrl;

    public void recordInitialPayment(Long tenantId, BigDecimal amount, String note) {
        try {
            String url = paymentServiceUrl + "/payments";
            LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
            
            // Generate due for ONLY this tenant (avoids calling back for all tenants)
            String genUrl = paymentServiceUrl + "/payments/generate-due-for-tenant?tenantId=" + tenantId + "&month=" + currentMonth;
            restTemplate.postForObject(genUrl, null, Void.class);

            // Now record the payment
            PaymentRequest req = PaymentRequest.builder()
                    .tenantId(tenantId)
                    .rentMonth(currentMonth)
                    .amountPaid(amount)
                    .paymentDate(LocalDate.now())
                    .paymentMode("CASH")
                    .note(note)
                    .build();

            restTemplate.postForObject(url, req, Object.class);
        } catch (Exception e) {
            System.err.println("Failed to record initial payment for tenant " + tenantId + ": " + e.getMessage());
        }
    }

    public TenantPaymentSummary getTenantPaymentSummary(Long tenantId) {
        try {
            String url = paymentServiceUrl + "/payments/tenant/" + tenantId;
            PaymentResponse[] responses = restTemplate.getForObject(url, PaymentResponse[].class);
            
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
            System.err.println("Failed to fetch payment summary for tenant " + tenantId + ": " + e.getMessage());
            return new TenantPaymentSummary(BigDecimal.ZERO, BigDecimal.ZERO);
        }
    }

    @Data
    public static class PaymentResponse {
        private BigDecimal amountPaid;
        private BigDecimal balance;
    }

    @Data @RequiredArgsConstructor
    public static class TenantPaymentSummary {
        private final BigDecimal totalPaid;
        private final BigDecimal outstanding;
    }

    @Data @Builder
    public static class PaymentRequest {
        private Long tenantId;
        private LocalDate rentMonth;
        private BigDecimal amountPaid;
        private LocalDate paymentDate;
        private String paymentMode;
        private String note;
    }

    @Data
    public static class GenerateDuesRequest {
        private LocalDate month;
        public GenerateDuesRequest(LocalDate month) { this.month = month; }
    }
}
