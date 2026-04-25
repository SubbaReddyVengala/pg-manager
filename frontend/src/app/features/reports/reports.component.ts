import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReportService, DashboardSummary, ProfitTrend, OutstandingDue } from '../../core/services/report.service';
import { RoomService } from '../../core/services/room.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartData, ChartType } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, BaseChartDirective,
    EmptyStateComponent
  ],
  template: `
    <div class="reports-container">
      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="title-section">
          <h2>Reports & Analytics</h2>
          <p>Financial & Occupancy Overview</p>
        </div>
        <div class="spacer"></div>
        <div class="toolbar-actions">
          <select [(ngModel)]="selectedMonth" class="month-picker" (change)="loadData()">
            <option *ngFor="let m of monthOptions" [value]="m.value">{{ m.label }}</option>
          </select>
          <button mat-flat-button class="export-btn pdf" (click)="exportPdf()">
            <mat-icon>picture_as_pdf</mat-icon> Export PDF
          </button>
          <button mat-flat-button class="export-btn excel" (click)="exportExcel()">
            <mat-icon>table_chart</mat-icon> Export Excel
          </button>
        </div>
      </div>

      <!-- SUMMARY CARDS -->
      <div class="stats-grid" *ngIf="summary">
        <div class="stat-card revenue">
          <div class="card-top">
            <span class="card-label">REVENUE</span>
            <mat-icon class="card-mini-icon">payments</mat-icon>
          </div>
          <div class="card-value">₹{{ summary.monthlyRevenue / 1000 | number:'1.0-0' }}K</div>
          <div class="card-trend up">↑ {{ summary.revenueGrowthRate }}%</div>
        </div>

        <div class="stat-card outstanding">
          <div class="card-top">
            <span class="card-label">OUTSTANDING</span>
            <mat-icon class="card-mini-icon">warning</mat-icon>
          </div>
          <div class="card-value">₹{{ summary.outstandingAmount / 1000 | number:'1.1-1' }}K</div>
          <div class="card-trend down">↓ from last mo</div>
        </div>

        <div class="stat-card occupancy">
          <div class="card-top">
            <span class="card-label">OCCUPANCY</span>
            <mat-icon class="card-mini-icon">bar_chart</mat-icon>
          </div>
          <div class="card-value">{{ summary.occupancyRate }}%</div>
          <div class="card-trend up">↑ 5%</div>
        </div>

        <div class="stat-card profit">
          <div class="card-top">
            <span class="card-label">NET PROFIT</span>
            <mat-icon class="card-mini-icon">ads_click</mat-icon>
          </div>
          <div class="card-value">₹{{ summary.monthlyProfit / 1000 | number:'1.0-0' }}K</div>
          <div class="card-subtext">After expenses</div>
        </div>
      </div>

      <!-- MAIN CHARTS ROW -->
      <div class="charts-row" *ngIf="summary">
        <div class="main-chart-card">
          <h3>Income vs Expenses — Last 6 Months</h3>
          <div class="chart-legend">
             <span class="leg-item"><span class="dot green"></span> Income</span>
             <span class="leg-item"><span class="dot red"></span> Expenses</span>
          </div>
          <div class="chart-container">
            <canvas baseChart
              [data]="barChartData"
              [options]="barChartOptions"
              [type]="barChartType">
            </canvas>
          </div>
        </div>

        <div class="side-chart-card">
          <h3>Room Occupancy</h3>
          <div class="donut-container">
            <canvas baseChart
              [data]="doughnutChartData"
              [options]="doughnutChartOptions"
              [type]="doughnutChartType">
            </canvas>
            <div class="donut-center">
              <div class="center-val">{{ summary.occupancyRate }}%</div>
              <div class="center-lbl">OCCUPIED</div>
            </div>
          </div>
          <div class="donut-legend">
            <div class="legend-item"><span class="dot green"></span> Occupied ({{ summary.occupiedRooms }})</div>
            <div class="legend-item"><span class="dot orange"></span> Maintenance ({{ summary.maintenanceRooms }})</div>
            <div class="legend-item"><span class="dot red"></span> Available ({{ summary.availableRooms }})</div>
          </div>
        </div>
      </div>

      <!-- OUTSTANDING DUES TABLE -->
      <div class="dues-section">
        <h3><mat-icon>warning</mat-icon> Outstanding Dues This Month</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>TENANT</th>
                <th>ROOM</th>
                <th>AMOUNT DUE</th>
                <th>DAYS OVERDUE</th>
                <th>LAST REMINDER</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let due of outstandingDues">
                <td class="tenant-name">{{ due.tenantName }}</td>
                <td>{{ due.roomNumber }}</td>
                <td class="amount-val">₹{{ due.amountDue | number }}</td>
                <td class="overdue-val">{{ due.daysOverdue }} days</td>
                <td>{{ due.lastReminder | date:'dd-MMM-yyyy' }}</td>
                <td>
                  <button class="reminder-btn">
                    <mat-icon>smartphone</mat-icon> Send Reminder
                  </button>
                </td>
              </tr>
              <tr *ngIf="outstandingDues.length === 0">
                <td colspan="6">
                  <app-empty-state
                    icon="verified"
                    iconColor="#10b981"
                    iconBgColor="#ecfdf5"
                    title="All dues are clear!"
                    description="There are no outstanding rent payments for the selected month. Great job on collection!"
                    padding="40px 20px"
                  ></app-empty-state>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- LOADING STATE -->
      <div class="loading-wrap" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading analytics...</p>
      </div>
    </div>
  `,
  styles: [`
    .reports-container { padding: 24px; background: #f8fafc; min-height: 100vh; position: relative; }
    
    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .title-section h2 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
    .title-section p { margin: 4px 0 0; font-size: 12px; color: #64748b; font-weight: 500; }
    .spacer { flex: 1; }
    .toolbar-actions { display: flex; gap: 12px; align-items: center; }

    .month-picker { padding: 10px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 600; background: white; cursor: pointer; outline: none; transition: all 0.2s; color: #475569; }
    .month-picker:hover { border-color: #cbd5e1; }

    .export-btn { height: 42px; border-radius: 8px; font-weight: 700; font-size: 13px; text-transform: none; }
    .export-btn.pdf { background: #eff6ff; color: #2563eb; }
    .export-btn.excel { background: #f0fdf4; color: #166534; }
    .export-btn mat-icon { font-size: 20px; width: 20px; height: 20px; margin-right: 8px; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
    .stat-card { background: white; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-2px); }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .card-label { font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; }
    .card-mini-icon { font-size: 18px; width: 18px; height: 18px; opacity: 0.5; }
    .card-value { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
    .card-trend { font-size: 12px; font-weight: 700; }
    .card-trend.up { color: #10b981; }
    .card-trend.down { color: #ef4444; }
    .card-subtext { font-size: 12px; color: #94a3b8; font-weight: 500; }
    .revenue { border-top: 4px solid #10b981; }
    .outstanding { border-top: 4px solid #ef4444; }
    .occupancy { border-top: 4px solid #3b82f6; }
    .profit { border-top: 4px solid #a855f7; }

    .charts-row { display: grid; grid-template-columns: 2.8fr 1fr; gap: 24px; margin-bottom: 32px; }
    .main-chart-card, .side-chart-card { background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .main-chart-card h3, .side-chart-card h3 { margin: 0 0 8px; font-size: 15px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .chart-legend { display: flex; gap: 16px; margin-bottom: 24px; }
    .leg-item { font-size: 11px; font-weight: 700; color: #64748b; display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.green { background: #10b981; }
    .dot.red { background: #ef4444; }
    .dot.orange { background: #f59e0b; }
    .dot.blue { background: #3b82f6; }

    .chart-container { height: 320px; position: relative; }
    
    .donut-container { height: 220px; position: relative; margin: 20px 0 32px; }
    .donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; }
    .center-val { font-size: 28px; font-weight: 800; color: #1e293b; }
    .center-lbl { font-size: 9px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; margin-top: -2px; }
    
    .donut-legend { display: flex; flex-direction: column; gap: 12px; }
    .legend-item { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; color: #475569; }

    .dues-section { background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); overflow: hidden; }
    .dues-section h3 { padding: 24px 32px; margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; letter-spacing: 0.5px; }
    .dues-section h3 mat-icon { color: #f59e0b; font-size: 20px; width: 20px; height: 20px; }
    
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 16px 32px; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; background: #fdfdfd; border-bottom: 1px solid #f1f5f9; }
    td { padding: 18px 32px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #475569; font-weight: 500; }
    .tenant-name { font-weight: 700; color: #1e293b; }
    .amount-val { color: #ef4444; font-weight: 800; }
    .overdue-val { color: #ef4444; font-weight: 700; }
    .reminder-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: none; background: #1e293b; color: white; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .reminder-btn:hover { background: #334155; }
    .reminder-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .empty-row { text-align: center; padding: 60px; color: #94a3b8; font-weight: 600; font-size: 15px; }

    .loading-wrap { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; gap: 16px; border-radius: 12px; }
    .loading-wrap p { font-weight: 700; color: #64748b; }

    @media (max-width: 1400px) {
      .charts-row { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class ReportsComponent implements OnInit, OnDestroy {
  private reportService = inject(ReportService);
  private roomService = inject(RoomService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  summary: DashboardSummary | null = null;
  outstandingDues: OutstandingDue[] = [];
  selectedMonth = this.getInitialMonth();
  monthOptions = this.generateMonthOptions();
  loading = true;

  // Bar Chart Configuration
  public barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      y: { grid: { display: false }, ticks: { color: '#475569', font: { size: 11, weight: 'bold' } } }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { 
        data: [], 
        backgroundColor: '#10b981', 
        borderRadius: 4,
        barThickness: 12,
        label: 'Income'
      },
      { 
        data: [], 
        backgroundColor: '#ef4444', 
        borderRadius: 4,
        barThickness: 12,
        label: 'Expenses'
      }
    ]
  };

  // Doughnut Chart Configuration
  public doughnutChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '85%',
    plugins: { legend: { display: false } }
  };
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Occupied', 'Maintenance', 'Available'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  ngOnInit(): void {
    this.loadData();

    // Wire up global refresh button
    this.roomService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
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
    for (let i = 0; i < 12; i++) {
      const month = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const val = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
      const lbl = month.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ label: lbl, value: val });
    }
    return options;
  }

  loadData(): void {
    this.loading = true;
    
    forkJoin({
      summary: this.reportService.getDashboardSummary(),
      trend: this.reportService.getProfitTrend(6),
      dues: this.reportService.getOutstandingDues()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.outstandingDues = res.dues || [];
        
        // Update Bar Chart
        if (res.trend && res.trend.trends) {
          this.barChartData.labels = res.trend.trends.map(t => t.monthLabel.split(' ')[0]);
          this.barChartData.datasets[0].data = res.trend.trends.map(t => t.revenue);
          this.barChartData.datasets[1].data = res.trend.trends.map(t => t.expenses);
        }

        // Update Donut Chart
        if (res.summary) {
          this.doughnutChartData.datasets[0].data = [
            res.summary.occupiedRooms,
            res.summary.maintenanceRooms,
            res.summary.availableRooms
          ];
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading reports:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  exportPdf(): void {
    this.snackBar.open('Generating PDF Report...', 'Close', { duration: 2000 });
    this.reportService.exportPdf(this.selectedMonth).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PG-Report-${this.selectedMonth}.pdf`;
        a.click();
      },
      error: (err) => {
        console.error('PDF export failed', err);
        this.snackBar.open('PDF export failed. Ensure service is running.', 'Close', { duration: 3000 });
      }
    });
  }

  exportExcel(): void {
    this.snackBar.open('Generating Excel Report...', 'Close', { duration: 2000 });
    this.reportService.exportExcel(this.selectedMonth).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PG-Report-${this.selectedMonth}.xlsx`;
        a.click();
      },
      error: (err) => {
        console.error('Excel export failed', err);
        this.snackBar.open('Excel export failed. Ensure service is running.', 'Close', { duration: 3000 });
      }
    });
  }
}
