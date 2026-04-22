import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentService } from './payment.service';
import { RoomService } from '../../core/services/room.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Subject, takeUntil } from 'rxjs';
import { PaymentStats, PaymentResponse } from '../../shared/models/payment.models';
import { TenantResponse } from '../../shared/models/tenant.models';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatSnackBarModule, EmptyStateComponent],
  template: `
    <div class="payments-page">
      <!-- STATS -->
      <div class="stats-row" *ngIf="stats">
        <div class="stat-card collected">
          <div class="st-label">COLLECTED <mat-icon class="st-icon">check_circle</mat-icon></div>
          <div class="st-val">₹{{ stats.collected | number }}</div>
          <div class="st-sub">{{ stats.collectedCount }} fully paid</div>
        </div>
        <div class="stat-card outstanding">
          <div class="st-label">OUTSTANDING <mat-icon class="st-icon">warning</mat-icon></div>
          <div class="st-val">₹{{ stats.outstanding | number }}</div>
          <div class="st-sub overdue">{{ stats.overdueCount }} overdue</div>
        </div>
        <div class="stat-card due-week">
          <div class="st-label">DUE THIS WEEK <mat-icon class="st-icon">calendar_month</mat-icon></div>
          <div class="st-val">₹{{ stats.dueThisWeek | number }}</div>
          <div class="st-sub">{{ stats.dueThisWeekCount }} tenants</div>
        </div>
        <div class="stat-card deposits">
          <div class="st-label">DEPOSITS HELD <mat-icon class="st-icon">account_balance_wallet</mat-icon></div>
          <div class="st-val">₹{{ stats.depositsHeld | number }}</div>
          <div class="st-sub">{{ stats.depositsCount }} tenants</div>
        </div>
      </div>

      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search tenant..." [(ngModel)]="searchQuery" (input)="applyFilter()">
        </div>
        <div class="filter-tabs">
          <button *ngFor="let t of tabs" [class.active]="activeTab === t" (click)="setTab(t)">{{ t }}</button>
        </div>
        <div class="spacer"></div>
        <div class="toolbar-actions">
          <select [(ngModel)]="selectedMonth" class="month-picker" (change)="loadData()">
            <option *ngFor="let m of monthOptions" [value]="m.value">{{ m.label }}</option>
          </select>
          <button mat-flat-button color="primary" class="record-btn" (click)="openRecord()">
            <mat-icon>add</mat-icon> Record Payment
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>TENANT</th>
              <th>ROOM</th>
              <th>RENT AMOUNT</th>
              <th>MONTH</th>
              <th>PAID DATE</th>
              <th>MODE</th>
              <th>TXN ID</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredPayments" [class.overdue-row]="p.status === 'OVERDUE'">
              <td class="tenant-name">{{ p.tenantName }}</td>
              <td>{{ p.roomNumber }}</td>
              <td class="amount-val">₹{{ p.rentAmount | number }}</td>
              <td>
                {{ p.rentMonth | date:'MMM yyyy' }} 
                <mat-icon *ngIf="p.status === 'OVERDUE'" class="warn-mini">warning</mat-icon>
              </td>
              <td>{{ p.paymentDate ? (p.paymentDate | date:'dd-MMM') : '—' }}</td>
              <td>{{ p.paymentMode || '—' }}</td>
              <td class="txn-id">{{ p.transactionId || '—' }}</td>
              <td><span class="status-badge" [class]="p.status.toLowerCase()">{{ p.status }} {{ p.status === 'PARTIAL' ? '₹' + p.balance : '' }}</span></td>
              <td class="actions">
                <button *ngIf="p.status === 'PAID'" class="receipt-btn" (click)="downloadReceipt(p.id)">
                  <mat-icon>description</mat-icon> Receipt
                </button>
                <button *ngIf="p.status === 'OVERDUE' || p.status === 'PENDING'" class="record-mini-btn" (click)="openRecord(p)">Record</button>
                <button *ngIf="p.status === 'PARTIAL'" class="balance-btn" (click)="openRecord(p)">Record Balance</button>
                <button *ngIf="p.status === 'OVERDUE'" class="remind-btn"><mat-icon>smartphone</mat-icon> Remind</button>
              </td>
            </tr>
            <tr *ngIf="filteredPayments.length === 0">
              <td colspan="9">
                <app-empty-state
                  icon="payments"
                  title="No payments found"
                  description="We couldn't find any payments for this month or matching your search. Try changing the month or search query."
                ></app-empty-state>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- SIDE DRAWER (Record Payment) -->
      <div class="drawer-overlay" *ngIf="showDrawer" (click)="closeDrawer()">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>Record Payment</h2>
            <button class="close-x" (click)="closeDrawer()"><mat-icon>close</mat-icon></button>
          </div>
          
          <div class="receipt-preview">
             <div class="receipt-header">PG MANAGER</div>
             <div class="receipt-title">Rent Receipt</div>
             <div class="receipt-amount">₹{{ paymentForm.value.amountPaid || '0' }}</div>
             <div class="receipt-grid">
                <div class="r-row"><span>Tenant</span> <strong>{{ selectedTenantName || '—' }}</strong></div>
                <div class="r-row"><span>Room</span> <strong>{{ selectedRoomNumber || '—' }}</strong></div>
                <div class="r-row"><span>Month</span> <strong>{{ paymentForm.value.rentMonth | date:'MMMM yyyy' }}</strong></div>
                <div class="r-row"><span>Paid On</span> <strong>{{ paymentForm.value.paymentDate | date:'dd MMM yyyy' }}</strong></div>
                <div class="r-row"><span>Mode</span> <strong>{{ paymentForm.value.paymentMode }}</strong></div>
                <div class="r-row"><span>Txn ID</span> <strong>{{ paymentForm.value.transactionId || '—' }}</strong></div>
             </div>
             <div class="receipt-footer">Receipt Preview | PG Manager System</div>
          </div>

          <form [formGroup]="paymentForm" (ngSubmit)="savePayment()" class="drawer-form">
            <p class="section-title">TENANT & MONTH</p>
            <div class="field">
              <label>Select Tenant *</label>
              <select formControlName="tenantId" (change)="onTenantSelect()"
                      [class.invalid]="paymentForm.get('tenantId')?.invalid && paymentForm.get('tenantId')?.touched">
                <option [ngValue]="null">Choose tenant...</option>
                <option *ngFor="let t of activeTenants" [value]="t.id">{{ t.fullName }} — Room {{ t.roomNumber }}</option>
              </select>
              <span class="error-text" *ngIf="paymentForm.get('tenantId')?.invalid && paymentForm.get('tenantId')?.touched">Tenant is required</span>
            </div>
            <div class="field">
              <label>Payment Month *</label>
              <select formControlName="rentMonth">
                <option *ngFor="let m of monthOptions" [value]="m.value">{{ m.label }}</option>
              </select>
            </div>

            <p class="section-title" style="margin-top: 24px;">PAYMENT DETAILS</p>
            <div class="form-row">
              <div class="field">
                <label>Rent Amount (₹)</label>
                <input type="number" formControlName="rentAmount" readonly class="readonly">
              </div>
              <div class="field">
                <label>Amount Paid (₹) *</label>
                <input type="number" formControlName="amountPaid"
                       [class.invalid]="paymentForm.get('amountPaid')?.invalid && paymentForm.get('amountPaid')?.touched">
                <span class="error-text" *ngIf="paymentForm.get('amountPaid')?.invalid && paymentForm.get('amountPaid')?.touched">Required (min 0.01)</span>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Payment Date *</label>
                <input type="date" formControlName="paymentDate"
                       [class.invalid]="paymentForm.get('paymentDate')?.invalid && paymentForm.get('paymentDate')?.touched">
              </div>
              <div class="field">
                <label>Payment Mode *</label>
                <select formControlName="paymentMode">
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI (GPay/PhonePe)</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label>Transaction ID / Cheque No.</label>
              <input type="text" formControlName="transactionId" placeholder="Optional reference">
            </div>
            <div class="field">
              <label>Note</label>
              <input type="text" formControlName="note" placeholder="Optional note">
            </div>

            <div class="pdf-indicator" *ngIf="!isAlreadyPaid">
               <mat-icon>check_circle</mat-icon>
               <span>After saving — PDF receipt will be auto-generated</span>
            </div>

            <div class="already-paid-warning" *ngIf="isAlreadyPaid">
               <mat-icon>warning</mat-icon>
               <span>Already paid for this month.</span>
            </div>

            <div class="drawer-actions">
              <button type="button" class="btn-cancel" (click)="closeDrawer()">Cancel</button>
              <button type="submit" class="btn-submit" [disabled]="paymentForm.invalid || isAlreadyPaid">
                <mat-icon>payments</mat-icon> Save Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payments-page { padding: 24px; background: #f8fafc; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .month-picker { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; background: white; cursor: pointer; }
    .record-btn { border-radius: 8px; font-weight: 700; height: 42px; background: #1e293b !important; color: white !important; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .st-label { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .st-icon { font-size: 16px; width: 16px; height: 16px; color: #10b981; }
    .st-val { font-size: 24px; font-weight: 800; color: #1e293b; }
    .outstanding .st-icon { color: #ef4444; }
    .due-week .st-icon { color: #f59e0b; }
    .st-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .overdue { color: #ef4444; font-weight: 700; }

    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .spacer { flex: 1; }
    .toolbar-actions { display: flex; gap: 12px; align-items: center; }
    .search-wrap { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      background: #ffffff; 
      border: 1.5px solid #e2e8f0; 
      border-radius: 12px; 
      padding: 0 16px; 
      flex: 1; 
      max-width: 320px; 
      height: 44px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .search-wrap:focus-within {
      border-color: #1e293b;
      box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.05);
    }
    .search-wrap mat-icon { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; transition: color 0.2s; }
    .search-wrap:focus-within mat-icon { color: #1e293b; }
    .search-wrap input { border: none; outline: none; font-size: 14px; font-weight: 500; color: #1e293b; flex: 1; background: transparent; height: 100%; }
    .search-wrap input::placeholder { color: #94a3b8; }
    .filter-tabs { display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px; }
    .filter-tabs button { border: none; background: transparent; padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; }
    .filter-tabs button.active { background: #1e293b; color: white; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 20px; font-size: 11px; font-weight: 700; color: #94a3b8; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 16px 20px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #475569; vertical-align: middle; }
    .tenant-name { font-weight: 700; color: #1e293b; }
    .amount-val { font-weight: 700; color: #1e293b; }
    .warn-mini { font-size: 14px; width: 14px; height: 14px; color: #f59e0b; vertical-align: middle; margin-left: 4px; }
    .overdue-row { background: #fffcfc; }
    .status-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 12px; text-transform: uppercase; }
    .status-badge.paid { color: #10b981; background: #ecfdf5; }
    .status-badge.overdue { color: #ef4444; background: #fee2e2; }
    .status-badge.partial { color: #f59e0b; background: #fffbeb; }
    .status-badge.pending { color: #64748b; background: #f1f5f9; }

    .actions { display: flex; gap: 8px; align-items: center; }
    .receipt-btn { display: flex; align-items: center; gap: 6px; background: #f0fdf4; color: #10b981; border: 1px solid #dcfce7; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
    .receipt-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .record-mini-btn, .balance-btn { background: #fff7ed; color: #d97706; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
    .remind-btn { display: flex; align-items: center; gap: 4px; background: transparent; color: #4338ca; border: none; padding: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
    .remind-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 1000; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 480px; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.1); padding: 32px; display: flex; flex-direction: column; overflow-y: auto; }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .drawer-header h2 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
    .close-x { border: none; background: transparent; color: #94a3b8; cursor: pointer; }

    .receipt-preview { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: center; }
    .receipt-header { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; }
    .receipt-title { font-size: 14px; font-weight: 800; color: #1e293b; margin: 4px 0 12px; }
    .receipt-amount { font-size: 32px; font-weight: 800; color: #10b981; margin-bottom: 20px; }
    .receipt-grid { display: flex; flex-direction: column; gap: 8px; text-align: left; }
    .r-row { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
    .r-row strong { color: #1e293b; }
    .receipt-footer { margin-top: 20px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }

    .section-title { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    .drawer-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; position: relative; }
    .field label { font-size: 12px; font-weight: 600; color: #64748b; }
    .field input, .field select { border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; font-size: 14px; outline: none; background: white; transition: all 0.2s; }
    .field input:focus, .field select:focus { border-color: #3b82f6; }
    .field input.invalid, .field select.invalid { border-color: #ef4444; background: #fffafb; }
    .field input.readonly { background: #f1f5f9; color: #64748b; }
    .error-text { color: #ef4444; font-size: 10px; font-weight: 600; margin-top: 2px; }

    .pdf-indicator { margin-top: 24px; display: flex; align-items: center; gap: 10px; background: #f0fdf4; padding: 12px; border-radius: 8px; color: #166534; font-size: 12px; font-weight: 600; }
    .pdf-indicator mat-icon { font-size: 18px; width: 18px; height: 18px; color: #22c55e; }

    .already-paid-warning { margin-top: 24px; display: flex; align-items: center; gap: 10px; background: #fffbeb; padding: 12px; border-radius: 8px; color: #92400e; font-size: 12px; font-weight: 600; border: 1px solid #fde68a; }
    .already-paid-warning mat-icon { font-size: 18px; width: 18px; height: 18px; color: #f59e0b; }

    .drawer-actions { margin-top: 32px; display: flex; gap: 12px; padding-bottom: 20px; }
    .btn-cancel { flex: 1; border: 1px solid #e2e8f0; background: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-submit { flex: 1.5; border: none; background: #1e293b; color: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
    .btn-submit:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }
    .btn-submit:hover:not(:disabled) { background: #334155; }
  `]
})
export class PaymentsComponent implements OnInit, OnDestroy {
  private paymentService = inject(PaymentService);
  private roomService = inject(RoomService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  payments: PaymentResponse[] = [];
  filteredPayments: PaymentResponse[] = [];
  activeTenants: TenantResponse[] = [];
  stats: PaymentStats | null = null;
  
  selectedMonth = this.getInitialMonth();
  monthOptions: {label: string, value: string}[] = this.generateMonthOptions();
  
  searchQuery = '';
  activeTab = 'ALL';
  tabs = ['ALL', 'PAID', 'OVERDUE', 'PARTIAL', 'PENDING'];
  
  showDrawer = false;
  paymentForm: FormGroup;
  selectedTenantName = '';
  selectedRoomNumber: string | null = '';
  isAlreadyPaid = false;

  constructor() {
    this.paymentForm = this.fb.group({
      tenantId: [null, Validators.required],
      rentMonth: [this.getInitialMonth(), Validators.required],
      rentAmount: [null],
      amountPaid: [null, [Validators.required, Validators.min(0.01)]],
      paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
      paymentMode: ['CASH', Validators.required],
      transactionId: [''],
      note: ['']
    });

    this.paymentForm.get('tenantId')?.valueChanges.subscribe(() => this.checkStatus());
    this.paymentForm.get('rentMonth')?.valueChanges.subscribe(() => this.checkStatus());
  }

  private checkStatus() {
    const tid = this.paymentForm.value.tenantId;
    const month = this.paymentForm.value.rentMonth;
    if (tid && month) {
      this.paymentService.getByTenant(tid).subscribe(history => {
        const monthPrefix = month.substring(0, 7); // e.g. "2026-04"
        const existing = history.find(p => p.rentMonth.startsWith(monthPrefix));
        this.isAlreadyPaid = existing?.status === 'PAID';
        this.cdr.detectChanges();
      });
    } else {
      this.isAlreadyPaid = false;
    }
  }

  ngOnInit(): void { 
    this.loadData();
    this.loadTenants();

    // Wire up global refresh button
    this.roomService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadData();
        this.loadTenants();
      });

    // Handle Search via URL
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
        this.applyFilter();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getInitialMonth(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  }

  generateMonthOptions(): {label: string, value: string}[] {
    const options = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
      const month = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const val = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
      const lbl = month.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ label: lbl, value: val });
    }
    return options;
  }

  loadData(): void {
    this.paymentService.getByMonth(this.selectedMonth).subscribe(data => {
      this.payments = data;
      this.applyFilter();
      this.cdr.detectChanges();
    });
    this.paymentService.getStats(this.selectedMonth).subscribe(s => {
      this.stats = s;
      this.cdr.detectChanges();
    });
  }

  loadTenants(): void {
    this.paymentService.getActiveTenants().subscribe(data => {
      this.activeTenants = data;
      this.cdr.detectChanges();
    });
  }

  applyFilter(): void {
    this.filteredPayments = this.payments.filter(p => {
      if (!p || !p.tenantName) return false;
      const matchSearch = p.tenantName.toLowerCase().includes((this.searchQuery || '').toLowerCase());
      const matchTab = this.activeTab === 'ALL' || p.status === this.activeTab;
      return matchSearch && matchTab;
    });
    this.cdr.detectChanges();
  }

  setTab(t: string): void { this.activeTab = t; this.applyFilter(); }

  openRecord(payment?: any): void {
    this.paymentForm.reset({
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'CASH',
      rentMonth: this.selectedMonth
    });
    if (payment) {
      this.paymentForm.patchValue({
        tenantId: payment.tenantId,
        rentAmount: payment.rentAmount,
        amountPaid: payment.balance || payment.rentAmount,
        rentMonth: payment.rentMonth
      });
      this.onTenantSelect();
    }
    this.showDrawer = true;
    this.cdr.detectChanges();
  }

  closeDrawer(): void { this.showDrawer = false; }

  onTenantSelect(): void {
    const tid = this.paymentForm.value.tenantId;
    const tenant = this.activeTenants.find(t => t.id == tid);
    if (tenant) {
      this.selectedTenantName = tenant.fullName;
      this.selectedRoomNumber = tenant.roomNumber;
      this.paymentForm.patchValue({ rentAmount: tenant.monthlyRent, amountPaid: tenant.monthlyRent });
    } else {
      this.selectedTenantName = '';
      this.selectedRoomNumber = '';
    }
    this.cdr.detectChanges();
  }

  savePayment(): void {
    if (this.isAlreadyPaid) return;
    this.paymentService.record(this.paymentForm.value).subscribe({
      next: () => {
        this.snackBar.open('Payment recorded successfully!', 'OK', { duration: 3000 });
        this.loadData();
        this.closeDrawer();
      },
      error: (err) => {
        console.error('Error saving payment:', err);
        const msg = err.error?.message || 'Failed to record payment.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  downloadReceipt(id: number): void {
    this.paymentService.downloadReceipt(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt-${id}.pdf`;
        a.click();
      },
      error: (err) => {
        console.error('Error downloading receipt:', err);
        this.snackBar.open('Failed to download receipt.', 'Close', { duration: 3000 });
      }
    });
  }
}
