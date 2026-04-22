package com.pgmanager.api.payment.service;

import com.pgmanager.api.payment.dto.*;
import com.pgmanager.api.payment.enums.PaymentStatus;
import java.time.LocalDate;
import java.util.List;

public interface PaymentService {
    List<PaymentResponse>  getPaymentsByMonth(LocalDate month, PaymentStatus status);
    PaymentResponse        recordPayment(PaymentRequest req);
    PaymentStatsResponse   getStats(LocalDate month);
    List<PaymentResponse>  getPaymentsByTenant(Long tenantId);
    int                    generateDues(LocalDate month);   // returns count generated
    void                   generateDueForTenant(Long tenantId, LocalDate month);
    byte[]                 generateReceipt(Long paymentId); // returns PDF bytes
}
