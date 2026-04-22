package com.pgmanager.api.maintenance.controller;

import com.pgmanager.api.maintenance.dto.*;
import com.pgmanager.api.maintenance.entity.GeneralExpense;
import com.pgmanager.api.maintenance.enums.MaintenanceStatus;
import com.pgmanager.api.maintenance.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping("/tickets")
    public ResponseEntity<List<MaintenanceTicketResponse>> getTickets(
            @RequestParam(required = false) MaintenanceStatus status) {
        return ResponseEntity.ok(maintenanceService.getTickets(status));
    }

    @GetMapping("/stats")
    public ResponseEntity<MaintenanceStatsResponse> getStats() {
        return ResponseEntity.ok(maintenanceService.getStats());
    }

    @PostMapping("/tickets")
    public ResponseEntity<MaintenanceTicketResponse> raiseTicket(
            @Valid @RequestBody MaintenanceTicketRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(maintenanceService.raiseTicket(req));
    }

    @PatchMapping("/tickets/{id}/start")
    public ResponseEntity<MaintenanceTicketResponse> startWork(@PathVariable Long id) {
        return ResponseEntity.ok(maintenanceService.startWork(id));
    }

    @PatchMapping("/tickets/{id}/resolve")
    public ResponseEntity<MaintenanceTicketResponse> resolveTicket(
            @PathVariable Long id,
            @RequestParam(required = false) BigDecimal cost) {
        return ResponseEntity.ok(maintenanceService.resolveTicket(id, cost));
    }

    @PostMapping("/expenses")
    public ResponseEntity<Void> recordExpense(@Valid @RequestBody GeneralExpenseRequest req) {
        maintenanceService.recordExpense(req);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/expenses")
    public ResponseEntity<List<GeneralExpense>> getExpenses(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        return ResponseEntity.ok(maintenanceService.getExpenses(month));
    }

    @GetMapping("/profit")
    public ResponseEntity<NetProfitResponse> getProfit(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {
        return ResponseEntity.ok(maintenanceService.getNetProfit(month));
    }
}
