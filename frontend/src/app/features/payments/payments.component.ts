import {
  Component, OnInit, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { PaymentService } from './payment.service';
import { PaymentResponse, PaymentStats, PaymentStatus } from '../../shared/models/payment.models';
import { PaymentFormComponent } from './payment-form/payment-form.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatSelectModule, PaymentFormComponent
  ],
  template: `
  <div class='page'>

    <!-- PAGE HEADER -->
    <div class='page-header'>
      <div>
        <h1>Payment Management</h1>
        <p class='subtitle'>{{ selectedMonthLabel }} — Rent Cycle</p>
      </div>
      <div class='header-right'>
  <!-- Month Picker -->
  <select [(ngModel)]='selectedMonth' (change)='onMonthChange()' class='month-picker'>
    @for (m of months; track m.value) {
      <option [value]='m.value'>{{ m.label }}</option>
    }
  </select>
  <button mat-stroked-button (click)='generateDues()'>
    <mat-icon>auto_fix_high</mat-icon> Generate Dues
  </button>
  <button mat-flat-button color='primary' (click)='openRecord()'>
    <mat-icon>add</mat-icon> Record Payment
  </button>
</div>
    </div>

    <!-- STAT CARDS -->
    @if (stats) {
      <div class='stats-row'>
        <div class='stat-card green'>
          <mat-icon>payments</mat-icon>
          <div class='stat-info'>
            <span class='stat-value'>₹{{ stats.collected | number }}</span>
            <span class='stat-label'>Collected</span>
            <span class='stat-sub'>{{ stats.collectedCount }} Fully Paid</span>
          </div>
        </div>
        <div class='stat-card red'>
          <mat-icon>money_off</mat-icon>
          <div class='stat-info'>
            <span class='stat-value'>₹{{ stats.outstanding | number }}</span>
            <span class='stat-label'>Outstanding</span>
            <span class='stat-sub'>{{ stats.overdueCount }} Overdue</span>
          </div>
        </div>
        <div class='stat-card amber'>
          <mat-icon>schedule</mat-icon>
          <div class='stat-info'>
            <span class='stat-value'>₹{{ stats.dueThisWeek | number }}</span>
            <span class='stat-label'>Due This Week</span>
            <span class='stat-sub'>{{ stats.dueThisWeekCount }} on Due</span>
          </div>
        </div>
        <div class='stat-card blue'>
          <mat-icon>account_balance_wallet</mat-icon>
          <div class='stat-info'>
            <span class='stat-value'>₹{{ stats.depositsHeld | number }}</span>
            <span class='stat-label'>Deposits Held</span>
            <span class='stat-sub'>{{ stats.depositsCount }} Tenants</span>
          </div>
        </div>
      </div>
    }

    <!-- SEARCH + FILTER TABS -->
    <div class='toolbar'>
      <div class='search-wrap'>
        <mat-icon>search</mat-icon>
        <input [(ngModel)]='searchQuery' (input)='applyFilter()'
               placeholder='Search tenant name...' class='search-input'/>
      </div>
      <div class='filter-tabs'>
        @for (tab of filterTabs; track tab.value) {
          <button [class.active]='activeFilter === tab.value'
                  (click)='setFilter(tab.value)'>{{ tab.label }}</button>
        }
      </div>
    </div>

    <!-- TABLE -->
    @if (loading) {
      <div class='loading-wrap'><mat-spinner diameter='40'></mat-spinner></div>
    } @else {
      <div class='table-wrap'>
        <table>
          <thead>
            <tr>
              <th>Tenant</th><th>Room</th><th>Rent Amount</th>
              <th>Due Date</th><th>Paid Date</th><th>Mode</th>
              <th>Txn ID</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filtered; track p.id) {
              <tr [class.overdue-row]='p.overdue'>
                <td>
                  <div class='tenant-name'>{{ p.tenantName }}</div>
                  @if (p.overdue) {
                    <span class='overdue-badge'>Overdue</span>
                  }
                  @if (p.status === 'PARTIAL') {
                    <div class='partial-bar'>
                      <div class='partial-fill'
                           [style.width]='getPartialPct(p) + "%"'></div>
                    </div>
                    <span class='partial-text'>
                      ₹{{ p.amountPaid | number }} / ₹{{ p.rentAmount | number }}
                    </span>
                  }
                </td>
                <td>{{ p.roomNumber }}</td>
                <td>₹{{ p.rentAmount | number }}</td>
                <td [class.overdue-date]='p.overdue'>
                  {{ p.dueDate ? (p.dueDate | date:'dd-MMM') : '—' }}
                  @if (p.overdue) { <mat-icon class='warn-icon'>warning</mat-icon> }
                </td>
                <td>{{ p.paymentDate ? (p.paymentDate | date:'dd-MMM') : '—' }}</td>
                <td>{{ p.paymentMode ?? '—' }}</td>
                <td class='txn-id'>{{ p.transactionId ?? '—' }}</td>
                <td>
                  <span [class]='statusClass(p.status)'>{{ p.status }}</span>
                </td>
                <td class='actions'>
                  @if (p.status === 'PENDING' || p.status === 'OVERDUE' || p.status === 'PARTIAL') {
                    <button mat-stroked-button color='primary'
                            class='action-btn'
                            (click)='openRecord(p)'>
                      Record
                    </button>
                  }
                  @if (p.status === 'PAID' && p.receiptNumber) {
                    <button mat-stroked-button
                            class='action-btn receipt-btn'
                            (click)='downloadReceipt(p)'>
                      <mat-icon>receipt</mat-icon> Receipt
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan='9' class='empty-row'>
                  No payments found for this month.
                  <button mat-stroked-button (click)='generateDues()' style='margin-left:12px'>
                    Generate Dues
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- RECORD PAYMENT DRAWER -->
    @if (showForm) {
      <app-payment-form
        (saved)='onSaved()'
        (closed)='closeForm()'
      ></app-payment-form>
    }
  </div>
  `,
  styles: [`
    .page { padding:24px; }

    /* HEADER */
    .page-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px; }
    .page-header h1 { margin:0;font-size:24px;font-weight:700;color:#1F3864; }
    .subtitle { margin:4px 0 0;color:#666;font-size:14px; }
    .header-right { display:flex;align-items:center;gap:12px; }
    .month-picker {
      padding:8px 12px;border:1px solid #ddd;border-radius:8px;
      font-size:14px;background:#fff;cursor:pointer;
    }

    /* STATS */
    .stats-row { display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px; }
    .stat-card {
      display:flex;align-items:center;gap:14px;
      padding:20px;border-radius:12px;
      box-shadow:0 1px 4px rgba(0,0,0,.06);
    }
    .stat-card mat-icon { font-size:32px;width:32px;height:32px;opacity:.85;flex-shrink:0; }
    .stat-info { display:flex;flex-direction:column; }
    .stat-value { font-size:22px;font-weight:700;line-height:1; }
    .stat-label { font-size:12px;font-weight:600;margin-top:4px;opacity:.8; }
    .stat-sub   { font-size:11px;margin-top:2px;opacity:.7; }
    .stat-card.green { background:#E8F5E9;color:#2E7D32; }
    .stat-card.red   { background:#FFEBEE;color:#C62828; }
    .stat-card.amber { background:#FFF8E1;color:#F57F17; }
    .stat-card.blue  { background:#E3F2FD;color:#1565C0; }

    /* TOOLBAR */
    .toolbar { display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-wrap:wrap; }
    .search-wrap {
      display:flex;align-items:center;gap:8px;flex:1;min-width:260px;
      background:#fff;border:1px solid #ddd;border-radius:8px;padding:6px 12px;
    }
    .search-input { border:none;outline:none;flex:1;font-size:14px; }
    .filter-tabs { display:flex;gap:4px;flex-wrap:wrap; }
    .filter-tabs button {
      padding:6px 14px;border:1px solid #ddd;border-radius:20px;
      background:#fff;cursor:pointer;font-size:13px;transition:.2s;
    }
    .filter-tabs button.active { background:#1F3864;color:#fff;border-color:#1F3864; }

    /* TABLE */
    .loading-wrap { display:flex;justify-content:center;padding:60px; }
    .table-wrap { background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow-x:auto; }
    table { width:100%;border-collapse:collapse;min-width:900px; }
    thead tr { background:#1F3864; }
    th { color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.5px;
         padding:12px 14px;text-align:left;font-weight:600;white-space:nowrap; }
    td { padding:12px 14px;font-size:13px;border-bottom:1px solid #f0f0f0;vertical-align:middle; }
    tbody tr:hover { background:#f9f9f9; }

    /* OVERDUE ROW */
    .overdue-row td { background:#FFF5F5; }
    .overdue-row:hover td { background:#FFE8E8; }
    .overdue-date { color:#C62828;font-weight:600;display:flex;align-items:center;gap:4px; }
    .warn-icon { font-size:14px;width:14px;height:14px;color:#C62828; }
    .overdue-badge {
      display:inline-block;font-size:10px;background:#C62828;color:#fff;
      border-radius:4px;padding:1px 6px;margin-top:2px;
    }

    /* PARTIAL PAYMENT BAR */
    .tenant-name { font-weight:600;color:#1F3864; }
    .partial-bar { width:100%;height:4px;background:#E0E0E0;border-radius:2px;margin-top:4px;overflow:hidden; }
    .partial-fill { height:100%;background:#F57F17;border-radius:2px;transition:width .3s; }
    .partial-text { font-size:11px;color:#F57F17;margin-top:2px; }
    .txn-id { font-size:11px;color:#888;font-family:monospace; }
    .empty-row { text-align:center;color:#999;padding:40px; }

    /* STATUS BADGES */
    .badge-paid    { background:#E8F5E9;color:#2E7D32;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600; }
    .badge-pending { background:#FFF8E1;color:#F57F17;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600; }
    .badge-partial { background:#E3F2FD;color:#1565C0;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600; }
    .badge-overdue { background:#FFEBEE;color:#C62828;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600; }

    /* ACTION BUTTONS */
    .actions { display:flex;align-items:center;gap:6px; }
    .action-btn { font-size:12px;height:30px;line-height:30px;padding:0 10px; }
    .receipt-btn { color:#2E7D32;border-color:#2E7D32; }
  `]
})
export class PaymentsComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private cdr            = inject(ChangeDetectorRef);
  private snackBar       = inject(MatSnackBar);

  payments: PaymentResponse[] = [];
  filtered: PaymentResponse[] = [];
  stats:    PaymentStats | null = null;
  loading   = true;
  showForm  = false;
  searchQuery = '';
  activeFilter = 'ALL';

  filterTabs = [
    { label: 'All',     value: 'ALL'     },
    { label: 'Paid',    value: 'PAID'    },
    { label: 'Overdue', value: 'OVERDUE' },
    { label: 'Partial', value: 'PARTIAL' },
    { label: 'Pending', value: 'PENDING' },
  ];

  // Month picker — last 6 months + next month
  months = this.buildMonths();
  selectedMonth = this.months[0].value;

  get selectedMonthLabel() {
    return this.months.find(m => m.value === this.selectedMonth)?.label ?? '';
  }

  ngOnInit() { this.loadAll(); }

  buildMonths() {
    const result = [];
    const now = new Date();
    for (let i = -1; i <= 5; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = d.toISOString().split('T')[0];
      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      result.push({ value, label });
    }
    return result;
  }

  onMonthChange() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.paymentService.getByMonth(this.selectedMonth).subscribe(data => {
      this.payments = data;
      this.applyFilter();
      this.loading = false;
      this.cdr.detectChanges();
    });
    this.paymentService.getStats(this.selectedMonth).subscribe(s => {
      this.stats = s;
      this.cdr.detectChanges();
    });
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.payments.filter(p => {
      const matchStatus = this.activeFilter === 'ALL' || p.status === this.activeFilter;
      const matchSearch = !q || p.tenantName.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }

  setFilter(val: string) { this.activeFilter = val; this.applyFilter(); }

  statusClass(s: PaymentStatus) {
    return {
      'badge-paid':    s === 'PAID',
      'badge-pending': s === 'PENDING',
      'badge-partial': s === 'PARTIAL',
      'badge-overdue': s === 'OVERDUE',
    };
  }

  getPartialPct(p: PaymentResponse): number {
    if (!p.rentAmount) return 0;
    return Math.round((p.amountPaid / p.rentAmount) * 100);
  }

  openRecord(payment?: PaymentResponse) {
    this.showForm = true;
  }
  closeForm() { this.showForm = false; }
  onSaved() {
    this.closeForm();
    this.loadAll();
    this.snackBar.open('Payment recorded!', 'OK', { duration: 3000 });
  }

 downloadReceipt(p: PaymentResponse) {
  this.paymentService.downloadReceipt(p.id).subscribe((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  });
}

  generateDues() {
    this.paymentService.generateDues({ month: this.selectedMonth }).subscribe({
      next: (msg) => {
        this.snackBar.open(msg, 'OK', { duration: 4000 });
        this.loadAll();
      },
      error: () => this.snackBar.open('Failed to generate dues', 'Close', { duration: 3000 })
    });
  }
}
