package com.pgmanager.payment.enums;

public enum PaymentStatus {
    PENDING,      // due generated, not yet paid
    PAID,         // fully paid
    PARTIAL,      // partially paid, balance remaining
    OVERDUE       // past due date, not paid
}
