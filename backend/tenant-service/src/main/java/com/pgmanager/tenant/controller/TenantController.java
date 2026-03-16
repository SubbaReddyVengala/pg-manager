package com.pgmanager.tenant.controller;
import com.pgmanager.tenant.dto.*;
import com.pgmanager.tenant.enums.TenantStatus;
import com.pgmanager.tenant.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    // GET /tenants?status=ACTIVE&search=Ravi
    @GetMapping
    public ResponseEntity<List<TenantResponse>> getAll(
            @RequestParam(required=false) TenantStatus status,
            @RequestParam(required=false) String search) {
        return ResponseEntity.ok(tenantService.getAllTenants(status, search));
    }

    // GET /tenants/stats  (4 stat cards in Screenshot 1)
    @GetMapping("/stats")
    public ResponseEntity<TenantStatsResponse> getStats() {
        return ResponseEntity.ok(tenantService.getStats());
    }

    // GET /tenants/{id}  (detail view - Screenshot 3)
    @GetMapping("/{id}")
    public ResponseEntity<TenantDetailResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tenantService.getTenantById(id));
    }

    // POST /tenants  (Add Tenant button - Screenshot 2 form)
    @PostMapping
    public ResponseEntity<TenantResponse> create(
            @Valid @RequestBody TenantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tenantService.createTenant(request));
    }

    // PUT /tenants/{id}  (Edit button)
    @PutMapping("/{id}")
    public ResponseEntity<TenantResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TenantRequest request) {
        return ResponseEntity.ok(tenantService.updateTenant(id, request));
    }

    // POST /tenants/{id}/assign-room  (Assign Room button on PENDING row)
    @PostMapping("/{id}/assign-room")
    public ResponseEntity<TenantResponse> assignRoom(
            @PathVariable Long id,
            @Valid @RequestBody AssignRoomRequest request) {
        return ResponseEntity.ok(tenantService.assignRoom(id, request));
    }

    // POST /tenants/{id}/move-out  (Move Out button - Screenshot 3)
    @PostMapping("/{id}/move-out")
    public ResponseEntity<TenantResponse> moveOut(
            @PathVariable Long id,
            @Valid @RequestBody MoveOutRequest request) {
        return ResponseEntity.ok(tenantService.moveOut(id, request));
    }

    // DELETE /tenants/{id}  (blocked for ACTIVE tenants)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tenantService.deleteTenant(id);
        return ResponseEntity.noContent().build();
    }
}
