package com.pgmanager.api.payment.scheduler;

import com.pgmanager.api.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.List;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class RentDueScheduler {

    private final PaymentService paymentService;
    private final com.pgmanager.api.payment.repository.PaymentRepository paymentRepository;
    private final com.pgmanager.api.payment.client.NotificationServiceClient notificationClient;
    private final com.pgmanager.api.payment.client.TenantServiceClient tenantClient;

    // Runs at 00:00 on the 1st of every month — IST
    @Scheduled(cron = "0 0 0 1 * ?", zone = "Asia/Kolkata")
    public void generateMonthlyDues() {
        LocalDate thisMonth = LocalDate.now().withDayOfMonth(1);
        log.info("[Scheduler] Generating rent dues for {}", thisMonth);
        int count = paymentService.generateDues(thisMonth);
        log.info("[Scheduler] Generated {} dues for {}", count, thisMonth);
    }

    // Runs at 10:00 AM on the 5th of every month to send overdue alerts
    @Scheduled(cron = "0 0 10 5 * ?", zone = "Asia/Kolkata")
    public void sendOverdueAlerts() {
        LocalDate firstOfMonth = LocalDate.now().withDayOfMonth(1);
        log.info("[Scheduler] Checking for overdue payments for {}", firstOfMonth);
        
        List<com.pgmanager.api.payment.entity.RentPayment> pending = paymentRepository.findByRentMonthAndStatus(firstOfMonth, com.pgmanager.api.payment.enums.PaymentStatus.PENDING);
        
        for (com.pgmanager.api.payment.entity.RentPayment p : pending) {
            // Update status to OVERDUE
            p.setStatus(com.pgmanager.api.payment.enums.PaymentStatus.OVERDUE);
            paymentRepository.save(p);
            
            // Send notification
            com.pgmanager.api.payment.client.TenantServiceClient.TenantInfo tenant = tenantClient.getTenant(p.getTenantId());
            if (tenant != null) {
                notificationClient.send(com.pgmanager.api.payment.client.NotificationServiceClient.NotificationRequest.builder()
                    .tenantId(tenant.getId())
                    .recipient(tenant.getEmail())
                    .subject("Rent Overdue — " + tenant.getFullName())
                    .message(String.format("₹%s is 5 days overdue for %s. Last reminder sent. Please pay immediately to avoid further penalties.", 
                            p.getRentAmount(), firstOfMonth.format(java.time.format.DateTimeFormatter.ofPattern("MMMM yyyy"))))
                    .type("BOTH")
                    .build());
            }
        }
    }
}
