import {
  Component, OnInit, AfterViewInit,
  ChangeDetectorRef, inject, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { ReportService } from './report.service';
import { MonthlyReport, AnnualSummary } from '../../shared/models/report.models';
import { PaymentResponse } from '../../shared/models/payment.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatTabsModule
  ],
  template: `
  <div class='page'>

    <!-- PAGE HEADER -->
    <div class='page-header'>
      <div>
        <h1>Reports</h1>
        <p class='subtitle'>Monthly income, occupancy & payment analytics</p>
      </div>
    </div>

    <!-- TABS -->
    <mat-tab-group (selectedIndexChange)='onTabChange($event)'>

      <!-- TAB 1: MONTHLY REPORT -->
      <mat-tab label='Monthly Report'>
        <div class='tab-content'>

          <!-- Month selector + Export buttons -->
          <div class='report-toolbar'>
            <select [(ngModel)]='selectedMonth' (change)='loadMonthly()' class='month-picker'>
              @for (m of months; track m.value) {
                <option [value]='m.value'>{{ m.label }}</option>
              }
            </select>
            <div class='export-btns'>
              <button mat-stroked-button (click)='exportPdf()' [disabled]='!report'>
                <mat-icon>picture_as_pdf</mat-icon> Export PDF
              </button>
              <button mat-stroked-button (click)='exportExcel()' [disabled]='!report'>
                <mat-icon>table_chart</mat-icon> Export Excel
              </button>
            </div>
          </div>

          @if (loadingMonthly) {
            <div class='loading-wrap'><mat-spinner diameter='40'></mat-spinner></div>
          } @else if (report) {

            <!-- Summary Cards -->
            <div class='summary-grid'>
              <div class='sum-card green'>
                <div class='sum-label'>Total Collected</div>
                <div class='sum-value'>₹{{ report.totalCollected | number }}</div>
                <div class='sum-sub'>{{ report.paidCount }} fully paid</div>
              </div>
              <div class='sum-card red'>
                <div class='sum-label'>Total Outstanding</div>
                <div class='sum-value'>₹{{ report.totalOutstanding | number }}</div>
                <div class='sum-sub'>{{ report.overdueCount }} overdue</div>
              </div>
              <div class='sum-card blue'>
                <div class='sum-label'>Total Rent Due</div>
                <div class='sum-value'>₹{{ report.totalRentDue | number }}</div>
                <div class='sum-sub'>{{ report.totalTenants }} tenants</div>
              </div>
              <div class='sum-card amber'>
                <div class='sum-label'>Collection Rate</div>
                <div class='sum-value'>{{ report.collectionRate }}%</div>
                <div class='sum-sub'>{{ report.partialCount }} partial</div>
              </div>
            </div>

            <!-- Collection Rate Bar -->
            <div class='rate-bar-wrap'>
              <div class='rate-label'>Collection Rate — {{ report.collectionRate }}%</div>
              <div class='rate-bar'>
                <div class='rate-fill'
                     [style.width]='report.collectionRate + "%"'
                     [style.background]='getRateColor(report.collectionRate)'></div>
              </div>
            </div>

            <!-- Tenant Breakdown Table -->
            <div class='table-wrap'>
              <table>
                <thead>
                  <tr>
                    <th>Tenant</th><th>Room</th><th>Rent Due</th>
                    <th>Amount Paid</th><th>Balance</th>
                    <th>Status</th><th>Paid Date</th><th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of report.payments; track p.id) {
                    <tr [class.overdue-row]='p.overdue'>
                      <td class='tenant-name'>{{ p.tenantName }}</td>
                      <td>{{ p.roomNumber }}</td>
                      <td>₹{{ p.rentAmount | number }}</td>
                      <td>₹{{ p.amountPaid | number }}</td>
                      <td [class.balance-red]='p.balance > 0'>₹{{ p.balance | number }}</td>
                      <td><span [class]='statusClass(p.status)'>{{ p.status }}</span></td>
                      <td>{{ p.paymentDate ? (p.paymentDate | date:'dd MMM') : '—' }}</td>
                      <td>{{ p.paymentMode ?? '—' }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan='8' class='empty-row'>No payment data for this month.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </mat-tab>

      <!-- TAB 2: ANNUAL SUMMARY (Bar Chart) -->
      <mat-tab label='Annual Summary'>
        <div class='tab-content'>
          <div class='report-toolbar'>
            <select [(ngModel)]='selectedYear' (change)='loadAnnual()' class='month-picker'>
              @for (y of years; track y) {
                <option [value]='y'>{{ y }}</option>
              }
            </select>
          </div>

          @if (loadingAnnual) {
            <div class='loading-wrap'><mat-spinner diameter='40'></mat-spinner></div>
          } @else if (annual) {

            <!-- Annual Summary Cards -->
            <div class='summary-grid' style='margin-bottom:24px'>
              <div class='sum-card green'>
                <div class='sum-label'>Year Total Collected</div>
                <div class='sum-value'>₹{{ annual.totalCollected | number }}</div>
              </div>
              <div class='sum-card red'>
                <div class='sum-label'>Year Total Outstanding</div>
                <div class='sum-value'>₹{{ annual.totalOutstanding | number }}</div>
              </div>
            </div>

            <!-- Bar Chart -->
            <div class='chart-wrap'>
              <canvas #barChart></canvas>
            </div>

            <!-- Monthly breakdown table -->
            <div class='table-wrap' style='margin-top:24px'>
              <table>
                <thead>
                  <tr>
                    <th>Month</th><th>Collected</th><th>Outstanding</th><th>Tenants</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of annual.months; track m.month) {
                    <tr>
                      <td>{{ m.monthLabel }}</td>
                      <td class='amount-green'>₹{{ m.collected | number }}</td>
                      <td class='amount-red'>₹{{ m.outstanding | number }}</td>
                      <td>{{ m.tenantCount }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </mat-tab>

    </mat-tab-group>
  </div>
  `,
  styles: [`
    .page { padding:24px; }
    .page-header { margin-bottom:20px; }
    .page-header h1 { margin:0;font-size:24px;font-weight:700;color:#1F3864; }
    .subtitle { margin:4px 0 0;color:#666;font-size:14px; }
    .tab-content { padding:20px 0; }

    /* TOOLBAR */
    .report-toolbar { display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px; }
    .month-picker { padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px;background:#fff; }
    .export-btns { display:flex;gap:8px; }

    /* SUMMARY CARDS */
    .summary-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px; }
    .sum-card { padding:20px;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06); }
    .sum-label { font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;opacity:.8; }
    .sum-value { font-size:24px;font-weight:700;margin:8px 0 4px; }
    .sum-sub   { font-size:12px;opacity:.7; }
    .sum-card.green { background:#E8F5E9;color:#2E7D32; }
    .sum-card.red   { background:#FFEBEE;color:#C62828; }
    .sum-card.blue  { background:#E3F2FD;color:#1565C0; }
    .sum-card.amber { background:#FFF8E1;color:#F57F17; }

    /* COLLECTION RATE BAR */
    .rate-bar-wrap { margin-bottom:20px; }
    .rate-label { font-size:13px;font-weight:600;color:#1F3864;margin-bottom:8px; }
    .rate-bar { height:12px;background:#E0E0E0;border-radius:6px;overflow:hidden; }
    .rate-fill { height:100%;border-radius:6px;transition:width .5s ease; }

    /* TABLE */
    .loading-wrap { display:flex;justify-content:center;padding:60px; }
    .table-wrap { background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow-x:auto; }
    table { width:100%;border-collapse:collapse;min-width:700px; }
    thead tr { background:#1F3864; }
    th { color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:12px 14px;text-align:left;font-weight:600; }
    td { padding:12px 14px;font-size:13px;border-bottom:1px solid #f0f0f0;vertical-align:middle; }
    tbody tr:hover { background:#f9f9f9; }
    .overdue-row td { background:#FFF5F5; }
    .tenant-name { font-weight:600;color:#1F3864; }
    .balance-red { color:#C62828;font-weight:600; }
    .amount-green { color:#2E7D32;font-weight:600; }
    .amount-red   { color:#C62828; }
    .empty-row { text-align:center;color:#999;padding:40px; }

    /* STATUS BADGES */
    .badge-paid    { background:#E8F5E9;color:#2E7D32;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600; }
    .badge-pending { background:#FFF8E1;color:#F57F17;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600; }
    .badge-partial { background:#E3F2FD;color:#1565C0;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600; }
    .badge-overdue { background:#FFEBEE;color:#C62828;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600; }

    /* CHART */
    .chart-wrap { background:#fff;border-radius:12px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,.08); }
  `]
})
export class ReportsComponent implements OnInit, AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;

  private reportService = inject(ReportService);
  private cdr           = inject(ChangeDetectorRef);
  private snackBar      = inject(MatSnackBar);

  report:  MonthlyReport | null = null;
  annual:  AnnualSummary | null = null;
  loadingMonthly = true;
  loadingAnnual  = false;
  activeTab = 0;

  months = this.buildMonths();
  selectedMonth = this.months[0].value;
  years  = [2026, 2025, 2024];
  selectedYear = new Date().getFullYear();

  private chartInstance: any = null;

  ngOnInit() { this.loadMonthly(); }
  ngAfterViewInit() {}

  buildMonths() {
    const result = [];
    const now = new Date();
    for (let i = 0; i <= 11; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        value: d.toISOString().split('T')[0],
        label: d.toLocaleString('default', { month: 'long', year: 'numeric' })
      });
    }
    return result;
  }

  onTabChange(index: number) {
    this.activeTab = index;
    if (index === 1 && !this.annual) { this.loadAnnual(); }
  }

  loadMonthly() {
    this.loadingMonthly = true;
    this.reportService.getMonthlyReport(this.selectedMonth).subscribe({
      next: r => { this.report = r; this.loadingMonthly = false; this.cdr.detectChanges(); },
      error: () => { this.loadingMonthly = false; this.cdr.detectChanges(); }
    });
  }

  loadAnnual() {
    this.loadingAnnual = true;
    this.reportService.getAnnualSummary(this.selectedYear).subscribe({
      next: a => {
        this.annual = a;
        this.loadingAnnual = false;
        this.cdr.detectChanges();
        setTimeout(() => this.renderChart(), 100);
      },
      error: () => { this.loadingAnnual = false; this.cdr.detectChanges(); }
    });
  }

  renderChart() {
    if (!this.barChartRef || !this.annual) return;
    const Chart = (window as any).Chart;
    if (!Chart) { this.loadChartJs(); return; }
    if (this.chartInstance) { this.chartInstance.destroy(); }
    const ctx = this.barChartRef.nativeElement.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.annual.months.map(m => m.monthLabel),
        datasets: [
          { label: 'Collected', data: this.annual.months.map(m => m.collected),
            backgroundColor: '#2E7D32', borderRadius: 4 },
          { label: 'Outstanding', data: this.annual.months.map(m => m.outstanding),
            backgroundColor: '#C62828', borderRadius: 4 },
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  loadChartJs() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => this.renderChart();
    document.head.appendChild(script);
  }

  statusClass(s: string) {
    return {
      'badge-paid': s==='PAID', 'badge-pending': s==='PENDING',
      'badge-partial': s==='PARTIAL', 'badge-overdue': s==='OVERDUE'
    };
  }

  getRateColor(rate: number): string {
    if (rate >= 80) return '#2E7D32';
    if (rate >= 50) return '#F57F17';
    return '#C62828';
  }

  exportPdf() {
    this.reportService.exportPdf(this.selectedMonth).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  exportExcel() {
    this.reportService.exportExcel(this.selectedMonth).subscribe(blob => {
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `report-${this.selectedMonth}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

