package com.pgmanager.payment.controller;

import com.pgmanager.payment.dto.*;
import com.pgmanager.payment.enums.PaymentStatus;
import com.pgmanager.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // GET /payments?month=2026-03-01&status=PAID
    // Powers the main payment table with month picker + filter tabs
    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAll(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month,
            @RequestParam(required = false) PaymentStatus status) {
        return ResponseEntity.ok(paymentService.getPaymentsByMonth(month, status));
    }

    // GET /payments/stats?month=2026-03-01
    // Powers the 4 stat cards: Collected, Outstanding, Due This Week, Deposits Held
    @GetMapping("/stats")
    public ResponseEntity<PaymentStatsResponse> getStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        return ResponseEntity.ok(paymentService.getStats(month));
    }

    // GET /payments/tenant/{tenantId}
    // Powers tenant detail page payment history
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<PaymentResponse>> getByTenant(
            @PathVariable Long tenantId) {
        return ResponseEntity.ok(paymentService.getPaymentsByTenant(tenantId));
    }

    // POST /payments  (Record Payment button)
    @PostMapping
    public ResponseEntity<PaymentResponse> record(
            @Valid @RequestBody PaymentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.recordPayment(req));
    }

    // POST /payments/generate-dues  (called by scheduler + manual trigger)
    @PostMapping("/generate-dues")
    public ResponseEntity<String> generateDues(
            @RequestBody GenerateDuesRequest req) {
        int count = paymentService.generateDues(req.getMonth());
        return ResponseEntity.ok("Generated " + count + " dues for " + req.getMonth());
    }

    // GET /payments/{id}/receipt  (Receipt button in Screenshot 1)
    // Returns PDF bytes for download
    @GetMapping("/{id}/receipt")
    public ResponseEntity<byte[]> getReceipt(@PathVariable Long id) {
        byte[] pdf = paymentService.generateReceipt(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=receipt-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
