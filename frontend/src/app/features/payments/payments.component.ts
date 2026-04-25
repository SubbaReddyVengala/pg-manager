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
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PaymentStats, PaymentResponse } from '../../shared/models/payment.models';
import { TenantResponse } from '../../shared/models/tenant.models';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatSnackBarModule, EmptyStateComponent],
  template: `
    <div class="payments-page">
      <div class="header-actions-row">
         <div class="view-toggle">
          <button [class.active]="viewMode === 'HISTORY'" (click)="viewMode = 'HISTORY'" title="History View">
            <mat-icon>history</mat-icon> History
          </button>
          <button [class.active]="viewMode === 'COLLECT'" (click)="viewMode = 'COLLECT'" title="Quick Collect">
            <mat-icon>bolt</mat-icon> Quick Collect
          </button>
        </div>
        <button mat-flat-button color="primary" class="record-btn" (click)="openRecord()">
          <mat-icon>add</mat-icon> Record Individual
        </button>
      </div>

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
          <input type="text" placeholder="Search tenant or room..." [ngModel]="searchQuery" (ngModelChange)="onSearch($event)">
        </div>
        <div class="filter-tabs">
          <button *ngFor="let t of tabs" [class.active]="activeTab === t" (click)="setTab(t)">{{ t }}</button>
        </div>
        <div class="spacer"></div>
        <div class="toolbar-actions">
           <div class="density-toggle">
            <button [class.active]="density === 'COMFORTABLE'" (click)="density = 'COMFORTABLE'"><mat-icon>reorder</mat-icon></button>
            <button [class.active]="density === 'COMPACT'" (click)="density = 'COMPACT'"><mat-icon>view_headline</mat-icon></button>
          </div>
          <select [(ngModel)]="selectedMonth" class="month-picker" (change)="loadData()">
            <option *ngFor="let m of monthOptions" [value]="m.value">{{ m.label }}</option>
          </select>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-wrap" [class.compact]="density === 'COMPACT'">
        <!-- HISTORY VIEW -->
        <table *ngIf="viewMode === 'HISTORY' && payments.length > 0">
          <thead>
            <tr>
              <th (click)="onSort('tenantName')" class="sortable">
                TENANT
                <mat-icon *ngIf="sortField === 'tenantName'">{{ sortDir === 'asc' ? 'north' : 'south' }}</mat-icon>
                <mat-icon *ngIf="sortField !== 'tenantName'" class="sort-placeholder">unfold_more</mat-icon>
              </th>
              <th (click)="onSort('roomNumber')" class="sortable">
                ROOM
                <mat-icon *ngIf="sortField === 'roomNumber'">{{ sortDir === 'asc' ? 'north' : 'south' }}</mat-icon>
                <mat-icon *ngIf="sortField !== 'roomNumber'" class="sort-placeholder">unfold_more</mat-icon>
              </th>
              <th (click)="onSort('rentAmount')" class="sortable">
                RENT AMOUNT
                <mat-icon *ngIf="sortField === 'rentAmount'">{{ sortDir === 'asc' ? 'north' : 'south' }}</mat-icon>
                <mat-icon *ngIf="sortField !== 'rentAmount'" class="sort-placeholder">unfold_more</mat-icon>
              </th>
              <th>MONTH</th>
              <th (click)="onSort('paymentDate')" class="sortable">
                PAID DATE
                <mat-icon *ngIf="sortField === 'paymentDate'">{{ sortDir === 'asc' ? 'north' : 'south' }}</mat-icon>
                <mat-icon *ngIf="sortField !== 'paymentDate'" class="sort-placeholder">unfold_more</mat-icon>
              </th>
              <th>MODE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of payments; trackBy: trackById" [class.overdue-row]="p.status === 'OVERDUE'">
              <td class="tenant-name">{{ p.tenantName }}</td>
              <td class="room-num">{{ p.roomNumber }}</td>
              <td class="amount-val currency">₹{{ p.rentAmount | number }}</td>
              <td>{{ p.rentMonth | date:'MMM yyyy' }}</td>
              <td>{{ p.paymentDate ? (p.paymentDate | date:'dd MMM') : '—' }}</td>
              <td>{{ p.paymentMode || '—' }}</td>
              <td><span class="status-badge" [class]="p.status.toLowerCase()">{{ p.status }}</span></td>
              <td class="actions">
                <button *ngIf="p.status === 'PAID'" class="receipt-btn" (click)="downloadReceipt(p.id)">
                  <mat-icon>description</mat-icon> Receipt
                </button>
                <button *ngIf="p.status !== 'PAID'" class="record-mini-btn" (click)="openRecord(p)">Record</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- QUICK COLLECT MODE -->
        <table *ngIf="viewMode === 'COLLECT' && pendingPayments.length > 0">
          <thead>
            <tr>
              <th class="chk-col"><input type="checkbox" (change)="toggleAll($event)" [checked]="isAllSelected()"></th>
              <th>TENANT</th>
              <th>ROOM</th>
              <th>AMOUNT</th>
              <th>MODE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of pendingPayments; trackBy: trackById" [class.selected]="selectedIds.has(p.id || p.tenantId)">
              <td class="chk-col"><input type="checkbox" [checked]="selectedIds.has(p.id || p.tenantId)" (change)="toggleSelection(p.id || p.tenantId)"></td>
              <td class="tenant-name">{{ p.tenantName }}</td>
              <td class="room-num">{{ p.roomNumber }}</td>
              <td class="amount-val currency">₹{{ p.rentAmount | number }}</td>
              <td>
                 <select [(ngModel)]="batchModes[p.id || p.tenantId]" class="inline-select">
                    <option value="UPI">UPI</option>
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK</option>
                 </select>
              </td>
              <td><span class="status-badge" [class]="p.status.toLowerCase()">{{ p.status }}</span></td>
            </tr>
          </tbody>
        </table>

        <!-- PAGINATION CONTROLS -->
        <div class="pagination-bar" *ngIf="!loading && totalPages > 1 && viewMode === 'HISTORY'">
          <div class="pag-info">Showing {{ (currentPage * pageSize) + 1 }}–{{ Math.min((currentPage + 1) * pageSize, totalElements) }} of {{ totalElements }}</div>
          <div class="pag-buttons">
            <button [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)"><mat-icon>chevron_left</mat-icon></button>
            <button *ngFor="let p of getPageRange()" 
                    [class.active]="p === currentPage" 
                    (click)="goToPage(p)">{{ p + 1 }}</button>
            <button [disabled]="currentPage === totalPages - 1" (click)="goToPage(currentPage + 1)"><mat-icon>chevron_right</mat-icon></button>
          </div>
          <div class="pag-size">
            <span>Rows per page:</span>
            <select [ngModel]="pageSize" (ngModelChange)="setPageSize($event)">
              <option [value]="10">10</option>
              <option [value]="20">20</option>
              <option [value]="50">50</option>
            </select>
          </div>
        </div>

        <app-empty-state
          *ngIf="(viewMode === 'HISTORY' && payments.length === 0) || (viewMode === 'COLLECT' && pendingPayments.length === 0)"
          icon="payments"
          [title]="viewMode === 'COLLECT' ? 'All rents collected!' : 'No payments found'"
          [description]="viewMode === 'COLLECT' ? 'There are no pending payments for this month' : 'Try changing the month or search query.'"
          padding="120px 20px"
        ></app-empty-state>
      </div>

      <!-- BATCH ACTION BAR -->
      <div class="bulk-action-bar" *ngIf="viewMode === 'COLLECT' && selectedIds.size > 0">
        <div class="selection-info">
          <mat-icon>bolt</mat-icon>
          <span>Batch Record {{ selectedIds.size }} Payments</span>
        </div>
        <div class="bulk-actions">
           <button class="bulk-btn" (click)="saveBulk()">Record as Paid</button>
           <button class="bulk-clear" (click)="clearSelection()">Cancel</button>
        </div>
      </div>

      <!-- SIDE DRAWER (Individual Record) -->
      <div class="drawer-overlay" *ngIf="showDrawer" (click)="closeDrawer()">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>Record Payment</h2>
            <button class="close-x" (click)="closeDrawer()"><mat-icon>close</mat-icon></button>
          </div>
          
          <form [formGroup]="paymentForm" (ngSubmit)="savePayment()" class="drawer-form">
            <p class="section-title">TENANT & MONTH</p>
            <div class="field">
              <label>Select Tenant *</label>
              <select formControlName="tenantId" (change)="onTenantSelect()">
                <option [ngValue]="null">Choose tenant...</option>
                <option *ngFor="let t of activeTenants" [value]="t.id">{{ t.fullName }} — Room {{ t.roomNumber }}</option>
              </select>
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
                <input type="number" formControlName="amountPaid">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Payment Date *</label>
                <input type="date" formControlName="paymentDate">
              </div>
              <div class="field">
                <label>Payment Mode *</label>
                <select formControlName="paymentMode">
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank</option>
                </select>
              </div>
            </div>

            <div class="drawer-actions">
              <button type="button" class="btn-cancel" (click)="closeDrawer()">Cancel</button>
              <button type="submit" class="btn-submit" [disabled]="paymentForm.invalid">Save Payment</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payments-page { padding: 24px; background: transparent; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .title { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
    .subtitle { margin: 2px 0 0; font-size: 13px; color: #64748b; font-weight: 500; }
    
    .view-toggle { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; }
    .view-toggle button { border: none; background: transparent; padding: 6px 12px; border-radius: 8px; cursor: pointer; color: #64748b; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .view-toggle button.active { background: white; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .record-btn { border-radius: 8px; font-weight: 700; height: 42px; background: #1e293b !important; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
    .st-label { font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; text-transform: uppercase; }
    .st-icon { font-size: 16px; color: #10b981; }
    .st-val { font-size: 24px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
    .outstanding .st-icon { color: #ef4444; }
    .due-week .st-icon { color: #f59e0b; }
    .st-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; font-weight: 600; }
    .overdue { color: #ef4444; }

    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .search-wrap { display: flex; align-items: center; gap: 12px; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0 16px; flex: 1; max-width: 320px; height: 44px; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .search-wrap:focus-within { border-color: #1e293b; background: white; }
    .search-wrap input { border: none; outline: none; font-size: 14px; flex: 1; background: transparent; }
    .filter-tabs { display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px; }
    .filter-tabs button { border: none; background: transparent; padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; }
    .filter-tabs button.active { background: #1e293b; color: white; }
    .month-picker { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 700; background: white; cursor: pointer; outline: none; }
    .density-toggle { display: flex; background: #f1f5f9; padding: 4px; border-radius: 8px; margin-right: 8px; }
    .density-toggle button { border: none; background: transparent; padding: 4px 8px; border-radius: 6px; cursor: pointer; color: #64748b; display: flex; }
    .density-toggle button.active { background: white; color: #1e293b; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; position: relative; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 20px; font-size: 11px; font-weight: 700; color: #94a3b8; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; }
    th.sortable { cursor: pointer; user-select: none; transition: background 0.2s; }
    th.sortable:hover { background: #f8fafc; color: #1e293b; }
    th.sortable mat-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; margin-left: 4px; }
    .sort-placeholder { opacity: 0; color: #cbd5e1; }
    th.sortable:hover .sort-placeholder { opacity: 1; }
    td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #475569; vertical-align: middle; transition: padding 0.2s; }
    .compact td { padding: 8px 20px; font-size: 13px; }
    .chk-col { width: 40px; padding-right: 0 !important; }
    tr.selected { background: #eff6ff; }
    .tenant-name { font-weight: 700; color: #1e293b; }
    .room-num { font-weight: 700; color: #3b82f6; }
    .amount-val { font-weight: 700; color: #0f172a; }
    .status-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 12px; text-transform: uppercase; }
    .status-badge.paid { color: #10b981; background: #ecfdf5; }
    .status-badge.overdue { color: #ef4444; background: #fee2e2; }
    .inline-select { padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; font-weight: 700; color: #1e293b; background: #f8fafc; }

    .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .pag-info { font-size: 12px; color: #64748b; font-weight: 600; }
    .pag-buttons { display: flex; align-items: center; gap: 4px; }
    .pag-buttons button { border: 1px solid #e2e8f0; background: white; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .pag-buttons button:hover:not(:disabled) { border-color: #1e293b; color: #1e293b; }
    .pag-buttons button.active { background: #1e293b; border-color: #1e293b; color: white; }
    .pag-buttons button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pag-buttons button mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .pag-size { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b; font-weight: 600; }
    .pag-size select { border: 1px solid #e2e8f0; background: white; padding: 4px 8px; border-radius: 6px; font-weight: 700; outline: none; }

    .bulk-action-bar { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 12px 24px; border-radius: 16px; display: flex; align-items: center; gap: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 2000; animation: slideUp 0.3s ease-out; }
    @keyframes slideUp { from { transform: translate(-50%, 100px); } to { transform: translate(-50%, 0); } }
    .selection-info { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; border-right: 1px solid rgba(255,255,255,0.2); padding-right: 24px; }
    .bulk-btn { background: #10b981; border: none; color: white; padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
    .bulk-clear { background: transparent; border: none; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; }

    .receipt-btn { display: flex; align-items: center; gap: 6px; background: #f0fdf4; color: #10b981; border: 1px solid #dcfce7; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }
    .record-mini-btn { background: #fff7ed; color: #d97706; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }

    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 1000; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 480px; background: white; padding: 32px; display: flex; flex-direction: column; }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .drawer-header h2 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
    .close-x { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
    .section-title { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    .drawer-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 12px; font-weight: 600; color: #64748b; }
    .field input, .field select { border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; }
    .field input.readonly { background: #f1f5f9; }
    .drawer-actions { margin-top: auto; display: flex; gap: 12px; padding-top: 32px; }
    .btn-cancel { flex: 1; border: 1px solid #e2e8f0; background: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-submit { flex: 1.5; border: none; background: #1e293b; color: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
  `]
})
export class PaymentsComponent implements OnInit, OnDestroy {
  private paymentService = inject(PaymentService);
  private roomService = inject(RoomService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  payments: PaymentResponse[] = [];
  pendingPayments: PaymentResponse[] = [];
  activeTenants: TenantResponse[] = [];
  stats: PaymentStats | null = null;
  
  viewMode: 'HISTORY' | 'COLLECT' = 'HISTORY';
  density: 'COMFORTABLE' | 'COMPACT' = 'COMFORTABLE';
  selectedIds = new Set<number>();
  batchModes: {[key: number]: string} = {};
  searchQuery = '';
  private searchSubject = new Subject<string>();

  // Pagination State
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  sortField = 'tenantName';
  sortDir: 'asc' | 'desc' = 'asc';
  loading = true;
  Math = Math;

  selectedMonth = this.getInitialMonth();
  monthOptions: {label: string, value: string}[] = this.generateMonthOptions();
  tabs = ['ALL', 'PAID', 'OVERDUE', 'PARTIAL', 'PENDING'];
  activeTab = 'ALL';
  showDrawer = false;
  paymentForm: FormGroup;

  constructor() {
    this.paymentForm = this.fb.group({
      tenantId: [null, Validators.required],
      rentMonth: [this.selectedMonth, Validators.required],
      rentAmount: [null],
      amountPaid: [null, [Validators.required, Validators.min(0.01)]],
      paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
      paymentMode: ['CASH', Validators.required],
      transactionId: [''],
      note: ['']
    });

    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$)).subscribe(val => {
      this.searchQuery = val;
      this.currentPage = 0;
      this.loadData();
    });
  }

  ngOnInit(): void { 
    this.loadData(); 
    this.loadTenants();
    this.roomService.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => { this.loadData(); this.loadTenants(); });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadData(): void {
    this.loading = true;
    this.cdr.detectChanges();
    const sort = `${this.sortField},${this.sortDir}`;
    this.paymentService.getByMonth(this.selectedMonth, this.currentPage, this.pageSize, this.activeTab, this.searchQuery, sort)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.payments = res.content;
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
          
          if (this.viewMode === 'COLLECT') {
            this.pendingPayments = this.payments.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE');
            this.pendingPayments.forEach(p => { if (!this.batchModes[p.id || p.tenantId]) this.batchModes[p.id || p.tenantId] = 'UPI'; });
          }
          
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });

    this.paymentService.getStats(this.selectedMonth).subscribe(s => { this.stats = s; this.cdr.detectChanges(); });
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.currentPage = 0;
    this.loadData();
  }

  loadTenants(): void { this.paymentService.getActiveTenants().subscribe(data => { this.activeTenants = data; this.cdr.detectChanges(); }); }

  toggleSelection(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id); else this.selectedIds.add(id);
  }

  toggleAll(event: any): void {
    if (event.target.checked) this.pendingPayments.forEach(p => this.selectedIds.add(p.id || p.tenantId)); else this.selectedIds.clear();
  }

  isAllSelected(): boolean { return this.pendingPayments.length > 0 && this.pendingPayments.every(p => this.selectedIds.has(p.id || p.tenantId)); }
  clearSelection(): void { this.selectedIds.clear(); }

  saveBulk(): void {
    const batch = Array.from(this.selectedIds).map(id => {
      const p = this.pendingPayments.find(item => (item.id || item.tenantId) === id);
      return { tenantId: p?.tenantId, rentMonth: this.selectedMonth, amountPaid: p?.rentAmount, paymentMode: this.batchModes[id] || 'UPI', paymentDate: new Date().toISOString().split('T')[0] };
    });
    this.snackBar.open(`Recording ${batch.length} payments...`, 'OK', { duration: 2000 });
    let count = 0;
    const saveOne = (i: number) => {
      if (i >= batch.length) { this.snackBar.open(`Recorded ${count} payments.`, 'OK', { duration: 3000 }); this.clearSelection(); this.loadData(); return; }
      this.paymentService.record(batch[i] as any).subscribe({ next: () => { count++; saveOne(i + 1); }, error: () => saveOne(i + 1) });
    };
    saveOne(0);
  }

  getInitialMonth(): string { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; }
  generateMonthOptions(): any[] {
    const options = []; const d = new Date();
    for (let i = 0; i < 6; i++) {
      const month = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const val = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
      const lbl = month.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ label: lbl, value: val });
    }
    return options;
  }

  setTab(t: string): void { this.activeTab = t; this.currentPage = 0; this.loadData(); }
  onSearch(val: string): void { this.searchSubject.next(val); }
  goToPage(p: number): void { this.currentPage = p; this.loadData(); }
  setPageSize(s: number): void { this.pageSize = s; this.currentPage = 0; this.loadData(); }
  getPageRange(): number[] {
    const range = []; const start = Math.max(0, this.currentPage - 2); const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    for (let i = start; i <= end; i++) range.push(i); return range;
  }
  trackById(index: number, item: any): any { return item.id || item.tenantId; }
  openRecord(p?: any): void {
    this.paymentForm.reset({ paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'CASH', rentMonth: this.selectedMonth });
    if (p) { this.paymentForm.patchValue({ tenantId: p.tenantId, rentAmount: p.rentAmount, amountPaid: p.balance || p.rentAmount, rentMonth: p.rentMonth }); }
    this.showDrawer = true; this.cdr.detectChanges();
  }
  closeDrawer(): void { this.showDrawer = false; }
  onTenantSelect(): void {
    const tid = this.paymentForm.value.tenantId;
    const t = this.activeTenants.find(x => x.id == tid);
    if (t) this.paymentForm.patchValue({ rentAmount: t.monthlyRent, amountPaid: t.monthlyRent });
    this.cdr.detectChanges();
  }
  savePayment(): void {
    this.paymentService.record(this.paymentForm.value).subscribe({ next: () => { this.snackBar.open('Recorded!', 'OK', { duration: 3000 }); this.loadData(); this.closeDrawer(); }, error: () => this.snackBar.open('Error saving.', 'Close') });
  }
  downloadReceipt(id: number): void {
    this.paymentService.downloadReceipt(id).subscribe({ next: (blob) => { const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `Receipt-${id}.pdf`; a.click(); }, error: () => this.snackBar.open('Error downloading.', 'Close') });
  }
}
