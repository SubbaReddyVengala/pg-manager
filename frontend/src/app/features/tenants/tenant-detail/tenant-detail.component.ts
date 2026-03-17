import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TenantService } from '../tenant.service';
import { TenantFormComponent } from '../tenant-form/tenant-form.component';
import { TenantDetailResponse } from '../../../shared/models/tenant.models';

@Component({
  selector: 'app-tenant-detail',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    TenantFormComponent
  ],
  template: `
  <div class='page'>
    <div class='back-row'>
      <button mat-stroked-button (click)='goBack()'><mat-icon>arrow_back</mat-icon> Back</button>
    </div>

    @if (loading) {
      <div class='loading-wrap'><mat-spinner diameter='40'></mat-spinner></div>
    } @else if (tenant) {

      <!-- HEADER CARD -->
      <div class='profile-card'>
        <div class='avatar'>{{ initials }}</div>
        <div class='profile-info'>
          <h2>{{ tenant.fullName }}</h2>
          <p>{{ tenant.email }} · {{ tenant.phone }}</p>
          <span [class]='statusClass'>{{ tenant.status }}</span>
        </div>
        @if (tenant.isGoodStanding) {
          <div class='good-standing'><mat-icon>verified</mat-icon> Good Standing</div>
        }
        <div class='profile-actions'>
          <button mat-stroked-button (click)='openEdit()'>
            <mat-icon>edit</mat-icon> Edit
          </button>
          <button mat-stroked-button (click)='goToPayments()'
                  [disabled]='tenant.status !== "ACTIVE"'>
            <mat-icon>receipt_long</mat-icon> View Payments
          </button>
          @if (tenant.status === 'ACTIVE') {
            <button mat-flat-button color='warn' (click)='confirmMoveOut()'>
              <mat-icon>exit_to_app</mat-icon> Move Out
            </button>
          }
        </div>
      </div>

      <!-- PAYMENT SUMMARY -->
      <div class='summary-row'>
        <div class='summary-card'>
          <mat-icon class='s-icon green'>payments</mat-icon>
          <div class='s-info'>
            <span class='s-value'>₹{{ tenant.totalPaid | number }}</span>
            <span class='s-label'>Total Paid</span>
          </div>
        </div>
        <div class='summary-card'>
          <mat-icon class='s-icon red'>money_off</mat-icon>
          <div class='s-info'>
            <span class='s-value'>₹{{ tenant.outstanding | number }}</span>
            <span class='s-label'>Outstanding</span>
          </div>
        </div>
        <div class='summary-card'>
          <mat-icon class='s-icon blue'>calendar_today</mat-icon>
          <div class='s-info'>
            <span class='s-value'>{{ tenant.stayDurationMonths }}</span>
            <span class='s-label'>Months Stay</span>
          </div>
        </div>
      </div>

      <!-- DETAILS GRID -->
      <div class='detail-grid'>
        <div class='detail-section'>
          <h3>Room &amp; Rent</h3>
          <div class='detail-row'><span>Room</span><b>{{ tenant.roomNumber ?? '—' }}</b></div>
          <div class='detail-row'><span>Move-in</span><b>{{ tenant.moveInDate | date:'dd MMM yyyy' }}</b></div>
          <div class='detail-row'><span>Monthly Rent</span><b>₹{{ tenant.monthlyRent | number }}</b></div>
          <div class='detail-row'><span>Security Deposit</span><b>₹{{ tenant.securityDeposit | number }}</b></div>
          <div class='detail-row'><span>Rent Due Day</span><b>{{ tenant.rentDueDay }}</b></div>
        </div>
        <div class='detail-section'>
          <h3>Identity</h3>
          <div class='detail-row'><span>ID Type</span><b>{{ tenant.idProofType }}</b></div>
          <div class='detail-row'><span>ID Number</span><b>{{ tenant.idNumber }}</b></div>
          <div class='detail-row'><span>Emergency Contact</span><b>{{ tenant.emergencyContact }}</b></div>
          <div class='detail-row'><span>Emergency Phone</span><b>{{ tenant.emergencyPhone }}</b></div>
          <div class='detail-row'><span>Address</span><b>{{ tenant.permanentAddress }}</b></div>
        </div>
      </div>
    }

    @if (showForm && tenant) {
      <app-tenant-form
        [tenant]='tenant'
        (saved)='onEdited()'
        (closed)='showForm = false'
      ></app-tenant-form>
    }
  </div>
  `,
  styles: [`
    .page { padding:24px;max-width:1000px;margin:0 auto; }
    .back-row { margin-bottom:20px; }
    .loading-wrap { display:flex;justify-content:center;padding:60px; }

    /* Profile header card */
    .profile-card {
      display:flex;align-items:center;gap:20px;
      background:#1F3864;color:#fff;border-radius:12px;padding:24px;margin-bottom:20px;
    }
    .avatar {
      width:64px;height:64px;border-radius:50%;background:#70A0D0;
      display:flex;align-items:center;justify-content:center;
      font-size:24px;font-weight:700;flex-shrink:0;
    }
    .profile-info { flex:1; }
    .profile-info h2 { margin:0 0 4px;font-size:22px; }
    .profile-info p { margin:0 0 8px;opacity:.8;font-size:14px; }
    .good-standing {
      display:flex;align-items:center;gap:6px;
      background:#2E7D32;border-radius:8px;padding:8px 14px;font-size:14px;
    }
    .profile-actions { display:flex;gap:8px;flex-wrap:wrap; }
    .profile-actions button { color:#fff !important;border-color:rgba(255,255,255,.4) !important; }

    /* Status badges */
    .badge-active  { background:#E8F5E9;color:#2E7D32;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600; }
    .badge-pending { background:#FFF8E1;color:#F57F17;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600; }
    .badge-inactive{ background:rgba(255,255,255,.2);color:#fff;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600; }

    /* Payment summary */
    .summary-row { display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px; }
    .summary-card {
      display:flex;align-items:center;gap:16px;
      background:#fff;border-radius:10px;padding:20px;
      box-shadow:0 1px 4px rgba(0,0,0,.08);
    }
    .s-info { display:flex;flex-direction:column; }
    .s-value { font-size:22px;font-weight:700; }
    .s-label { font-size:12px;color:#666;margin-top:2px; }
    .s-icon { font-size:32px;width:32px;height:32px; }
    .s-icon.green { color:#2E7D32; }
    .s-icon.red   { color:#C62828; }
    .s-icon.blue  { color:#1565C0; }

    /* Detail grid */
    .detail-grid { display:grid;grid-template-columns:1fr 1fr;gap:16px; }
    .detail-section {
      background:#fff;border-radius:10px;padding:20px;
      box-shadow:0 1px 4px rgba(0,0,0,.08);
    }
    .detail-section h3 { margin:0 0 16px;font-size:14px;font-weight:600;
      color:#1F3864;text-transform:uppercase;letter-spacing:.5px; }
    .detail-row { display:flex;justify-content:space-between;
      padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px; }
    .detail-row span { color:#666; }
    .detail-row b { color:#222;max-width:60%;text-align:right; }
  `]
})
export class TenantDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tenantService = inject(TenantService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  tenant: TenantDetailResponse | null = null;
  loading = true;
  showForm = false;

  get initials() {
    if (!this.tenant) return '';
    return this.tenant.fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  }

  get statusClass() {
    const s = this.tenant?.status;
    return { 'badge-active': s==='ACTIVE', 'badge-pending': s==='PENDING', 'badge-inactive': s==='INACTIVE' };
  }

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.tenantService.getById(id).subscribe(t => {
      this.tenant = t; this.loading = false; this.cdr.detectChanges();
    });
  }

  goBack() { this.router.navigate(['/dashboard/tenants']); }
  openEdit() { this.showForm = true; }
  onEdited() {
    this.showForm = false;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.tenantService.getById(id).subscribe(t => {
      this.tenant = t; this.cdr.detectChanges();
      this.snackBar.open('Tenant updated!', 'OK', { duration: 3000 });
    });
  }

  goToPayments() {
    this.router.navigate(['/dashboard/payments'], { queryParams: { tenantId: this.tenant?.id } });
  }

  confirmMoveOut() {
    if (!this.tenant) return;
    if (!confirm(`Move out ${this.tenant.fullName}? This will mark them INACTIVE and free their room.`)) return;
    this.tenantService.moveOut(this.tenant.id).subscribe({
      next: t => {
        this.tenant = t; this.cdr.detectChanges();
        this.snackBar.open('Tenant moved out successfully.', 'OK', { duration: 4000 });
      },
      error: () => this.snackBar.open('Move out failed. Check server logs.', 'Close', { duration: 4000 })
    });
  }
}
