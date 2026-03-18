package com.pgmanager.payment.client;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TenantServiceClient {

    private final RestTemplate restTemplate;

    @Value("${tenant-service.url}")
    private String tenantServiceUrl;

    public List<TenantInfo> getActiveTenants() {
        String url = tenantServiceUrl + "/tenants?status=ACTIVE";
        return restTemplate.exchange(
                url, HttpMethod.GET, null,
                new ParameterizedTypeReference<List<TenantInfo>>() {}
        ).getBody();
    }

    // Gets total security deposits from all active tenants
    public BigDecimal getTotalDeposits() {
        List<TenantInfo> tenants = getActiveTenants();
        if (tenants == null) return BigDecimal.ZERO;
        return tenants.stream()
                .map(t -> t.getSecurityDeposit() != null ? t.getSecurityDeposit() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public long getActiveTenantsCount() {
        List<TenantInfo> tenants = getActiveTenants();
        return tenants != null ? tenants.size() : 0;
    }

    @Data
    public static class TenantInfo {
        private Long       id;
        private String     fullName;
        private Long       roomId;
        private String     roomNumber;
        private BigDecimal monthlyRent;
        private BigDecimal securityDeposit;
        private Integer    rentDueDay;
        private String     status;
    }
}

