package com.pgmanager.payment.service;
import com.pgmanager.common.enums.PaymentStatus;
import com.pgmanager.payment.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;

public interface PaymentService {
    Page<PaymentResponse>  getPaymentsByMonth(LocalDate month, PaymentStatus status, Pageable pageable);
    PaymentResponse        recordPayment(PaymentRequest req);
    PaymentStatsResponse   getStats(LocalDate month);
    List<PaymentResponse>  getPaymentsByTenant(Long tenantId);
    int                    generateDues(LocalDate month);   // returns count generated
    void                   generateDueForTenant(Long tenantId, LocalDate month);
    byte[]                 generateReceipt(Long paymentId); // returns PDF bytes
}
