package com.pgmanager.payment.service;

import com.pgmanager.payment.dto.*;
import com.pgmanager.payment.enums.PaymentStatus;
import java.time.LocalDate;
import java.util.List;

public interface PaymentService {
    List<PaymentResponse>  getPaymentsByMonth(LocalDate month, PaymentStatus status);
    PaymentResponse        recordPayment(PaymentRequest req);
    PaymentStatsResponse   getStats(LocalDate month);
    List<PaymentResponse>  getPaymentsByTenant(Long tenantId);
    int                    generateDues(LocalDate month);   // returns count generated
    byte[]                 generateReceipt(Long paymentId); // returns PDF bytes
}
