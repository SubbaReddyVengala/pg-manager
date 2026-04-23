package com.pgmanager.api.maintenance.client;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
@Component("maintenancePaymentServiceClient")
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceClient {

    private final RestTemplate restTemplate;

    @Value("${payment-service.url}")
    private String paymentServiceUrl;

    public BigDecimal getMonthlyRevenue(LocalDate month) {
        try {
            String url = paymentServiceUrl + "/payments/stats?month=" + month.toString();
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("collected")) {
                Object collected = response.get("collected");
                if (collected instanceof Number) {
                    return new BigDecimal(collected.toString());
                }
            }
        } catch (Exception e) {
            // Log error and return zero revenue as fallback
            System.err.println("Failed to fetch revenue from payment-service: " + e.getMessage());
        }
        return BigDecimal.ZERO;
    }
}
