package com.pgmanager.room.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TenantServiceClient {

    private final RestTemplate restTemplate;

    @Value("${tenant-service.url}")
    private String tenantServiceUrl;

    public boolean hasActiveTenantsByRoomNumber(String roomNumber) {
        try {
            String url = tenantServiceUrl + "/tenants?status=ACTIVE";
            List<?> tenants = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<?>>() {}
            ).getBody();
            if (tenants == null) return false;
            return tenants.stream().anyMatch(t -> {
                if (t instanceof java.util.Map) {
                    Object rn = ((java.util.Map<?,?>) t).get("roomNumber");
                    return roomNumber.equals(String.valueOf(rn));
                }
                return false;
            });
        } catch (Exception e) {
            return false;
        }
    }
}