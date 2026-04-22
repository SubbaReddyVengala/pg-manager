import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TenantService } from '../tenant.service';
import { RoomService } from '../../../core/services/room.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, ConfirmDialogComponent],
  template: `
    <div class="detail-page">
      
      <!-- LOADING STATE -->
      <div class="loading-wrap" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading tenant details...</p>
      </div>

      <!-- ERROR STATE -->
      <div class="error-wrap" *ngIf="error && !loading">
        <mat-icon>error_outline</mat-icon>
        <h3>Failed to load tenant</h3>
        <p>There was an error fetching the tenant details. Please try again.</p>
        <button mat-flat-button color="primary" (click)="ngOnInit()">Retry</button>
      </div>

      <div class="detail-content" *ngIf="tenant && !loading">
        <div class="header">
          <div class="title-wrap">
            <mat-icon class="back-icon" (click)="goBack()">arrow_back</mat-icon>
            <h1>Tenant Detail View — {{ tenant.fullName }}</h1>
          </div>
          <div class="actions">
            <button mat-flat-button class="btn-edit" (click)="onEdit()">
              <mat-icon>edit</mat-icon> Edit
            </button>
            <button mat-flat-button class="btn-view-payments" (click)="onViewPayments()">
              <mat-icon>payments</mat-icon> View Payments
            </button>
            <button mat-flat-button class="btn-move-out" (click)="onMoveOut()" [disabled]="tenant?.status === 'INACTIVE'">
              <mat-icon>exit_to_app</mat-icon> Move Out
            </button>
          </div>
        </div>

        <div class="content-grid">
          <div class="main-info">
            <div class="info-grid">
              <div class="info-item">
                <label>FULL NAME</label>
                <div class="val">{{ tenant.fullName }}</div>
              </div>
              <div class="info-item">
                <label>PHONE</label>
                <div class="val">{{ tenant.phone }}</div>
              </div>
              <div class="info-item">
                <label>EMAIL</label>
                <div class="val">{{ tenant.email }}</div>
              </div>
              <div class="info-item">
                <label>ROOM ASSIGNED</label>
                <div class="val text-blue">{{ tenant.roomNumber || 'Not Assigned' }}</div>
              </div>
              <div class="info-item">
                <label>MOVE-IN DATE</label>
                <div class="val">{{ tenant.moveInDate | date:'dd MMM yyyy' }}</div>
              </div>
              <div class="info-item">
                <label>MONTHLY RENT</label>
                <div class="val text-green">₹{{ tenant.monthlyRent | number }}</div>
              </div>
              <div class="info-item">
                <label>SECURITY DEPOSIT</label>
                <div class="val">₹{{ tenant.securityDeposit | number }}</div>
              </div>
              <div class="info-item">
                <label>ID PROOF</label>
                <div class="val">{{ tenant.idProofType }} — {{ tenant.idNumber }}</div>
              </div>
              <div class="info-item">
                <label>EMERGENCY CONTACT</label>
                <div class="val">{{ tenant.emergencyContact }} — {{ tenant.emergencyPhone }}</div>
              </div>
              <div class="info-item">
                <label>STATUS</label>
                <div class="val">
                  <span class="badge" [class]="tenant.status.toLowerCase()">{{ tenant.status }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="side-info">
            <div class="summary-card">
              <h3>PAYMENT SUMMARY</h3>
              <div class="sum-item">
                <label>Total Paid</label>
                <span class="val text-green">₹{{ tenant.totalPaid | number }}</span>
              </div>
              <div class="sum-item">
                <label>Outstanding</label>
                <span class="val text-red">₹{{ tenant.outstanding | number }}</span>
              </div>
              <div class="sum-item">
                <label>Stay Duration</label>
                <span class="val">{{ tenant.stayDurationMonths }} months</span>
              </div>
            </div>

            <div class="standing-card">
              <div class="standing-header">
                <span class="standing-label">GOOD STANDING</span>
                <mat-icon class="check">check_box</mat-icon>
              </div>
              <p>All payments up to date</p>
            </div>
          </div>
        </div>
      </div>

      <!-- CONFIRM MOVE OUT -->
      <app-confirm-dialog
        *ngIf="showMoveOutConfirm"
        title="Confirm Move Out"
        [message]="'Are you sure you want to mark ' + tenant.fullName + ' as Moved Out? This will free up room ' + tenant.roomNumber + '.'"
        confirmText="Yes, Move Out"
        type="warning"
        (confirm)="executeMoveOut()"
        (cancel)="showMoveOutConfirm = false">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .detail-page { padding: 24px; background: #f8fafc; min-height: 400px; }
    
    .loading-wrap, .error-wrap { 
      display: flex; flex-direction: column; align-items: center; 
      justify-content: center; height: 300px; color: #64748b; 
    }
    .spinner {
      width: 40px; height: 40px; border: 4px solid #e2e8f0;
      border-top-color: #3b82f6; border-radius: 50%;
      animation: spin 1s linear infinite; margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-wrap mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ef4444; margin-bottom: 16px; }
    .error-wrap h3 { color: #1e293b; margin-bottom: 8px; }
    .error-wrap p { margin-bottom: 24px; }

    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .title-wrap { display: flex; align-items: center; gap: 16px; }
    .back-icon { cursor: pointer; color: #64748b; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
    .actions { display: flex; gap: 12px; }
    .actions button { border-radius: 8px; font-weight: 700; font-size: 13px; text-transform: none; }
    .btn-edit { background: #f59e0b !important; color: white !important; transition: background 0.2s; }
    .btn-edit:hover { background: #d97706 !important; }

    .btn-view-payments { background: #10b981 !important; color: white !important; transition: background 0.2s; }
    .btn-view-payments:hover { background: #059669 !important; }

    .btn-move-out { background: #ef4444 !important; color: white !important; transition: background 0.2s; }
    .btn-move-out:hover:not(:disabled) { background: #dc2626 !important; }
    
    .btn-move-out:disabled { background: #cbd5e1 !important; color: #94a3b8 !important; }

    .content-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
    .main-info { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
    .info-item label { display: block; font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 8px; }
    .info-item .val { font-size: 15px; font-weight: 700; color: #1e293b; }
    .text-blue { color: #3b82f6 !important; }
    .text-green { color: #10b981 !important; }
    .text-red { color: #ef4444 !important; }
    .badge { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; }
    .badge.active { color: #10b981; background: #ecfdf5; }
    .badge.pending { color: #f59e0b; background: #fffbeb; }
    .badge.inactive { color: #ef4444; background: #fee2e2; }

    .side-info { display: flex; flex-direction: column; gap: 24px; }
    .summary-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; }
    .summary-card h3 { font-size: 11px; font-weight: 700; color: #94a3b8; margin: 0 0 20px; }
    .sum-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .sum-item label { font-size: 13px; color: #64748b; font-weight: 500; }
    .sum-item .val { font-size: 16px; font-weight: 800; }

    .standing-card { background: #f0fdf4; border-radius: 12px; border: 1px solid #dcfce7; padding: 20px; text-align: center; }
    .standing-header { display: flex; align-items: center; justify-content: center; gap: 8px; color: #10b981; font-weight: 800; font-size: 13px; margin-bottom: 4px; }
    .standing-header .check { font-size: 18px; width: 18px; height: 18px; }
    .standing-card p { margin: 0; font-size: 12px; color: #10b981; font-weight: 600; opacity: 0.8; }
  `]
})
export class TenantDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private tenantService = inject(TenantService);
  private roomService = inject(RoomService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  tenant: any = null;
  loading = true;
  error = false;
  currentId: number | null = null;
  showMoveOutConfirm = false;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.currentId = +id;
        this.loadTenant(this.currentId);
      }
    });

    // Wire up global refresh button
    this.roomService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.currentId) this.loadTenant(this.currentId);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTenant(id: number): void {
    this.loading = true;
    this.error = false;
    this.cdr.detectChanges(); 

    this.tenantService.getById(id).subscribe({
      next: (data) => {
        this.tenant = data;
        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error loading tenant:', err);
        this.loading = false;
        this.error = true;
        this.cdr.detectChanges();
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/dashboard/tenants'], { queryParams: { search: this.tenant.fullName, action: 'edit', id: this.tenant.id } });
  }

  onViewPayments(): void {
    this.router.navigate(['/dashboard/payments'], { queryParams: { search: this.tenant.fullName } });
  }

  onMoveOut(): void {
    this.showMoveOutConfirm = true;
  }

  executeMoveOut(): void {
    this.showMoveOutConfirm = false;
    this.tenantService.moveOut(this.tenant.id).subscribe({
      next: () => {
        this.snackBar.open('Tenant moved out successfully.', 'OK', { duration: 3000 });
        this.loadTenant(this.tenant.id);
      },
      error: (err) => {
        console.error('Error moving out tenant:', err);
        const msg = err.error?.message || 'Failed to process move out.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  goBack(): void { this.router.navigate(['/dashboard/tenants']); }
}
