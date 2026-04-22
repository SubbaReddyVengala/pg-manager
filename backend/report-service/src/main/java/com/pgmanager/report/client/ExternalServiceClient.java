package com.pgmanager.report.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ExternalServiceClient {

    private final RestTemplate restTemplate;

    @Value("${room.service.url:http://localhost:8082/rooms}")
    private String roomServiceUrl;

    @Value("${payment.service.url:http://localhost:8084/payments}")
    private String paymentServiceUrl;

    @Value("${maintenance.service.url:http://localhost:8089/maintenance}")
    private String maintenanceServiceUrl;

    @Value("${tenant.service.url:http://localhost:8083/tenants}")
    private String tenantServiceUrl;

    public RoomStats getRoomStats() {
        return restTemplate.getForObject(roomServiceUrl + "/stats", RoomStats.class);
    }

    public PaymentStats getPaymentStats(LocalDate month) {
        String url = paymentServiceUrl + "/stats?month=" + month.toString();
        return restTemplate.getForObject(url, PaymentStats.class);
    }

    public MaintenanceStats getMaintenanceStats() {
        return restTemplate.getForObject(maintenanceServiceUrl + "/stats", MaintenanceStats.class);
    }

    public NetProfit getNetProfit(LocalDate month) {
        String url = maintenanceServiceUrl + "/profit?month=" + month.toString();
        return restTemplate.getForObject(url, NetProfit.class);
    }

    public List<RoomDetail> getAllRooms() {
        RoomDetail[] res = restTemplate.getForObject(roomServiceUrl, RoomDetail[].class);
        return res != null ? Arrays.asList(res) : List.of();
    }

    public List<TenantDetail> getAllTenants() {
        TenantDetail[] res = restTemplate.getForObject(tenantServiceUrl, TenantDetail[].class);
        return res != null ? Arrays.asList(res) : List.of();
    }

    public List<PaymentDetail> getPaymentsByMonth(LocalDate month) {
        String url = paymentServiceUrl + "?month=" + month.toString();
        PaymentDetail[] res = restTemplate.getForObject(url, PaymentDetail[].class);
        return res != null ? Arrays.asList(res) : List.of();
    }

    public TenantStats getTenantStats() {
        return restTemplate.getForObject(tenantServiceUrl + "/stats", TenantStats.class);
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RoomDetail {
        private String roomNumber;
        private int floor;
        private String roomType;
        private int occupancy;
        private int maxCapacity;
        private BigDecimal rentAmount;
        private String status;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TenantDetail {
        private String fullName;
        private String roomNumber;
        private String phone;
        private String status;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PaymentDetail {
        private String tenantName;
        private String roomNumber;
        private BigDecimal rentAmount;
        private BigDecimal amountPaid;
        private BigDecimal balance;
        private String status;
        private LocalDate paymentDate;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RoomStats {
        private long totalRooms;
        private long occupied;
        private long available;
        private long maintenance;
        private long floorCount;
        private double occupancyRate;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PaymentStats {
        private BigDecimal collected;
        private BigDecimal outstanding;
        private long collectedCount;
        private long overdueCount;
        private double growthRate;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MaintenanceStats {
        private long openCount;
        private long inProgressCount;
        private long resolvedCount;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class NetProfit {
        private BigDecimal totalRevenue;
        private BigDecimal totalMaintenanceCost;
        private BigDecimal totalGeneralExpenses;
        private BigDecimal netProfit;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TenantStats {
        private long active;
        private long pending;
        private long inactive;
        private long moveOutsThisMonth;
    }
}
