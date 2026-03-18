package com.pgmanager.payment.scheduler;

import com.pgmanager.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class RentDueScheduler {

    private final PaymentService paymentService;

    // Runs at 00:00 on the 1st of every month — IST
    @Scheduled(cron = "0 0 0 1 * ?", zone = "Asia/Kolkata")
    public void generateMonthlyDues() {
        LocalDate thisMonth = LocalDate.now().withDayOfMonth(1);
        log.info("[Scheduler] Generating rent dues for {}", thisMonth);
        int count = paymentService.generateDues(thisMonth);
        log.info("[Scheduler] Generated {} dues for {}", count, thisMonth);
    }
}
