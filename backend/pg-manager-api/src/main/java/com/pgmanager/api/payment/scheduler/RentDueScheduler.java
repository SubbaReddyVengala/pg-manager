package com.pgmanager.api.payment.scheduler;

import com.pgmanager.api.payment.entity.RentPayment;
import com.pgmanager.common.enums.PaymentStatus;
import com.pgmanager.api.payment.repository.PaymentRepository;
import com.pgmanager.api.payment.client.NotificationServiceClient;
import com.pgmanager.api.payment.client.TenantServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.math.BigDecimal;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class RentDueScheduler {

    private final PaymentRepository paymentRepository;
    private final NotificationServiceClient notificationClient;
    private final TenantServiceClient tenantClient;

    // Runs at 00:00 on the 1st of every month — IST
    @Scheduled(cron = "0 0 0 1 * ?", zone = "Asia/Kolkata")
    public void generateMonthlyDues() {
        LocalDate firstOfMonth = LocalDate.now().withDayOfMonth(1);
        log.info("[Scheduler] Generating rent dues for {}", firstOfMonth);
        
        List<TenantServiceClient.TenantInfo> activeTenants = tenantClient.getAllActiveTenantsIgnoreOwner();
        int count = 0;
        
        for (TenantServiceClient.TenantInfo t : activeTenants) {
            if (paymentRepository.findByOwnerIdAndTenantIdAndRentMonth(t.getOwnerId(), t.getId(), firstOfMonth).isPresent()) {
                continue;
            }
            RentPayment due = RentPayment.builder()
                    .ownerId(t.getOwnerId())
                    .tenantId(t.getId())
                    .tenantName(t.getFullName())
                    .roomId(t.getRoomId())
                    .roomNumber(t.getRoomNumber())
                    .rentMonth(firstOfMonth)
                    .rentAmount(t.getMonthlyRent())
                    .amountPaid(BigDecimal.ZERO)
                    .balance(t.getMonthlyRent())
                    .status(PaymentStatus.PENDING)
                    .build();
            paymentRepository.save(due);
            
            notificationClient.send(NotificationServiceClient.NotificationRequest.builder()
                .tenantId(t.getId())
                .ownerId(t.getOwnerId())
                .recipient(t.getEmail())
                .subject("Rent Due — " + t.getFullName())
                .amount(t.getMonthlyRent())
                .message(String.format("Rent of ₹%s for %s is now due.", 
                        t.getMonthlyRent(), firstOfMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy"))))
                .type("OVERDUE")
                .build());
            count++;
        }
        log.info("[Scheduler] Generated {} dues for {}", count, firstOfMonth);
    }

    // Runs at 10:00 AM on the 5th of every month to send overdue alerts
    @Scheduled(cron = "0 0 10 5 * ?", zone = "Asia/Kolkata")
    public void sendOverdueAlerts() {
        LocalDate firstOfMonth = LocalDate.now().withDayOfMonth(1);
        log.info("[Scheduler] Checking for overdue payments for {}", firstOfMonth);
        
        List<RentPayment> pending = paymentRepository.findAllByRentMonthAndStatus(firstOfMonth, PaymentStatus.PENDING);
        
        for (RentPayment p : pending) {
            // Update status to OVERDUE
            p.setStatus(PaymentStatus.OVERDUE);
            paymentRepository.save(p);
            
            // Send notification
            TenantServiceClient.TenantInfo tenant = tenantClient.getTenant(p.getTenantId());
            if (tenant != null) {
                notificationClient.send(NotificationServiceClient.NotificationRequest.builder()
                    .tenantId(tenant.getId())
                    .ownerId(tenant.getOwnerId())
                    .recipient(tenant.getEmail())
                    .subject("Rent Overdue — " + tenant.getFullName())
                    .amount(p.getRentAmount())
                    .message(String.format("₹%s is 5 days overdue for %s. Last reminder sent. Please pay immediately to avoid further penalties.", 
                            p.getRentAmount(), firstOfMonth.format(DateTimeFormatter.ofPattern("MMMM yyyy"))))
                    .type("BOTH")
                    .build());
            }
        }
    }
}




