import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportService, DashboardSummary, ProfitTrend, OutstandingDue } from '../../../core/services/report.service';
import { RoomService } from '../../../core/services/room.service';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { forkJoin, Subject, takeUntil } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule, BaseChartDirective],
  template: `
    <div class="dashboard-home">
      
      <!-- TOP STATS -->
      <div class="stats-row" *ngIf="summary">
        <div class="stat-card total">
          <div class="st-label">TOTAL ROOMS <mat-icon class="st-icon">home</mat-icon></div>
          <div class="st-val">{{ summary.totalRooms }}</div>
          <div class="st-sub">{{ summary.floorCount }} floors</div>
        </div>
        <div class="stat-card occupied">
          <div class="st-label">OCCUPIED <mat-icon class="st-icon">vpn_key</mat-icon></div>
          <div class="st-val">{{ summary.occupiedRooms }}</div>
          <div class="st-trend up">↑ {{ summary.occupancyRate }}% rate</div>
        </div>
        <div class="stat-card maintenance">
          <div class="st-label">MAINTENANCE <mat-icon class="st-icon">build</mat-icon></div>
          <div class="st-val">{{ summary.maintenanceRooms }}</div>
          <div class="st-sub">{{ summary.openMaintenanceTickets }} open tickets</div>
        </div>
        <div class="stat-card tenants">
          <div class="st-label">ACTIVE TENANTS <mat-icon class="st-icon">groups</mat-icon></div>
          <div class="st-val">{{ summary.activeTenants }}</div>
          <div class="st-sub">{{ summary.pendingTenants }} pending</div>
        </div>
        <div class="stat-card collected">
          <div class="st-label">COLLECTED <mat-icon class="st-icon">payments</mat-icon></div>
          <div class="st-val">₹{{ summary.monthlyRevenue | number }}</div>
          <div class="st-trend up">↑ {{ summary.revenueGrowthRate }}% vs last mo</div>
        </div>
        <div class="stat-card outstanding">
          <div class="st-label">OUTSTANDING <mat-icon class="st-icon">warning</mat-icon></div>
          <div class="st-val">₹{{ summary.outstandingAmount | number }}</div>
          <div class="st-sub overdue">{{ summary.overduePaymentsCount }} overdue</div>
        </div>
      </div>

      <!-- MAIN CONTENT GRID -->
      <div class="main-grid" *ngIf="summary">
        <div class="charts-col">
          <!-- OCCUPANCY BAR SECTION -->
          <div class="chart-card occupancy-section">
            <h3>Occupancy Rate — {{ currentMonthLabel }}</h3>
            <div class="occ-hero">
              <span class="occ-pct">{{ summary.occupancyRate }}%</span>
              <span class="occ-badge" [class.warn]="summary.occupancyRate < 50">
                {{ summary.occupancyRate >= 70 ? 'Excellent' : (summary.occupancyRate >= 50 ? 'Good' : 'Low') }} 
                {{ summary.occupancyRate >= 50 ? '↑' : '↓' }}
              </span>
            </div>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="bar-fill occupied" [style.width]="(summary.occupiedRooms / summary.totalRooms * 100) + '%'"></div>
                <div class="bar-fill available" [style.width]="(summary.availableRooms / summary.totalRooms * 100) + '%'"></div>
                <div class="bar-fill maintenance" [style.width]="(summary.maintenanceRooms / summary.totalRooms * 100) + '%'"></div>
              </div>
              <div class="progress-legend">
                <span class="leg-item"><span class="dot green"></span> {{ summary.occupiedRooms }} Occupied</span>
                <span class="leg-item"><span class="dot blue"></span> {{ summary.availableRooms }} Available</span>
                <span class="leg-item"><span class="dot orange"></span> {{ summary.maintenanceRooms }} Maintenance</span>
              </div>
            </div>
          </div>

          <!-- INCOME TREND SECTION -->
          <div class="chart-card trend-section">
            <h3>Monthly Income Trend</h3>
            <div class="chart-wrap">
              <canvas baseChart
                [data]="barChartData"
                [options]="barChartOptions"
                [type]="barChartType">
              </canvas>
            </div>
          </div>
        </div>

        <!-- SIDEBAR SUMMARY -->
        <div class="summary-col">
          <div class="quick-summary-card">
            <h3>Quick Summary</h3>
            <div class="summary-list">
              <div class="sum-item">
                <span class="leg-item"><span class="dot blue"></span> Total Rooms</span>
                <strong>{{ summary.totalRooms }}</strong>
              </div>
              <div class="sum-item">
                <span class="leg-item"><span class="dot green"></span> Occupied</span>
                <strong class="text-green">{{ summary.occupiedRooms }}</strong>
              </div>
              <div class="sum-item">
                <span class="leg-item"><span class="dot light-blue"></span> Available</span>
                <strong class="text-blue">{{ summary.availableRooms }}</strong>
              </div>
              <div class="sum-item">
                <span class="leg-item"><span class="dot orange"></span> Maintenance</span>
                <strong class="text-orange">{{ summary.maintenanceRooms }}</strong>
              </div>
              <div class="sum-divider"></div>
              <div class="sum-item">
                <span class="leg-item"><span class="dot purple"></span> Active Tenants</span>
                <strong>{{ summary.activeTenants }}</strong>
              </div>
              <div class="sum-item">
                <span class="leg-item"><span class="dot green"></span> Collected</span>
                <strong class="text-green">₹{{ summary.monthlyRevenue | number }}</strong>
              </div>
              <div class="sum-item">
                <span class="leg-item"><span class="dot red"></span> Outstanding</span>
                <strong class="text-red">₹{{ summary.outstandingAmount | number }}</strong>
              </div>
              <div class="sum-item">
                <span class="leg-item"><span class="dot amber"></span> Open Tickets</span>
                <strong class="text-orange">{{ summary.openMaintenanceTickets }}</strong>
              </div>
            </div>
            
            <div class="alerts-section" *ngIf="dues.length > 0">
              <div class="alert-box" *ngFor="let d of dues">
                <mat-icon>warning</mat-icon>
                <span>{{ d.tenantName }} (Room {{ d.roomNumber }}) rent overdue by {{ d.daysOverdue }} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- LOADING OVERLAY -->
      <div class="loading-wrap" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Updating real-time stats...</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-home { padding: 8px 0 24px; background: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
    
    /* Stat Cards Styles */
    .stats-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border-top: 4px solid #94a3b8; }
    
    .stat-card.total { border-top-color: #78350f; } /* Brownish */
    .stat-card.total .st-icon { color: #78350f; }

    .stat-card.occupied { border-top-color: #fbbf24; } /* Yellow */
    .stat-card.occupied .st-icon { color: #ca8a04; }

    .stat-card.maintenance { border-top-color: #f97316; } /* Orange */
    .stat-card.maintenance .st-icon { color: #ea580c; }

    .stat-card.tenants { border-top-color: #a855f7; } /* Purple */
    .stat-card.tenants .st-icon { color: #7c3aed; }

    .stat-card.collected { border-top-color: #f59e0b; } /* Amber/Gold */
    .stat-card.collected .st-icon { color: #d97706; }

    .stat-card.outstanding { border-top-color: #ef4444; } /* Red */
    .stat-card.outstanding .st-icon { color: #dc2626; }

    .st-label { font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 0.8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .st-icon { font-size: 16px; width: 16px; height: 16px; opacity: 0.7; }
    .st-val { font-size: 24px; font-weight: 900; color: #1e293b; margin-bottom: 6px; }
    .st-sub { font-size: 11px; color: #94a3b8; font-weight: 600; }
    .st-trend { font-size: 11px; font-weight: 800; }
    .st-trend.up { color: #10b981; }
    .overdue { color: #ef4444; }

    /* Layout Content */
    .main-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
    .chart-card { background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; margin-bottom: 24px; }
    .chart-card h3 { margin: 0 0 24px; font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }

    .occ-hero { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .occ-pct { font-size: 36px; font-weight: 900; color: #1e293b; }
    .occ-badge { background: #f0fdf4; color: #10b981; padding: 5px 12px; border-radius: 12px; font-size: 11px; font-weight: 800; border: 1px solid #dcfce7; }
    .occ-badge.warn { background: #fff1f2; color: #ef4444; border-color: #fecdd3; }

    .progress-bar { height: 14px; background: #f1f5f9; border-radius: 10px; overflow: hidden; display: flex; margin-bottom: 20px; }
    .bar-fill { height: 100%; transition: width 1s ease-in-out; }
    .bar-fill.occupied { background: #10b981; }
    .bar-fill.available { background: #3b82f6; }
    .bar-fill.maintenance { background: #f59e0b; }
    
    .progress-legend { display: flex; gap: 24px; }
    .leg-item { font-size: 12px; color: #64748b; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .dot.green { background: #10b981; }
    .dot.blue { background: #3b82f6; }
    .dot.light-blue { background: #60a5fa; }
    .dot.orange { background: #f59e0b; }
    .dot.purple { background: #a855f7; }
    .dot.amber { background: #f59e0b; }
    .dot.red { background: #ef4444; }

    .chart-wrap { height: 280px; }

    /* Sidebar Summary */
    .quick-summary-card { background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; position: sticky; top: 24px; }
    .summary-list { display: flex; flex-direction: column; gap: 16px; }
    .sum-item { display: flex; justify-content: space-between; align-items: center; }
    .sum-item strong { font-size: 14px; font-weight: 800; color: #1e293b; }
    .sum-divider { height: 1px; background: #f1f5f9; margin: 8px 0; }
    .text-green { color: #10b981; }
    .text-blue { color: #3b82f6; }
    .text-orange { color: #f59e0b; }
    .text-red { color: #ef4444; }

    .alerts-section { margin-top: 32px; display: flex; flex-direction: column; gap: 12px; }
    .alert-box { background: #fff7ed; padding: 14px; border-radius: 10px; display: flex; gap: 10px; color: #9a3412; font-size: 11px; font-weight: 700; line-height: 1.5; border: 1px solid #ffedd5; }
    .alert-box mat-icon { font-size: 18px; width: 18px; height: 18px; color: #f59e0b; }

    .loading-wrap { position: fixed; inset: 0; background: rgba(255,255,255,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; gap: 16px; }
    .loading-wrap p { font-weight: 800; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }

    @media (max-width: 1400px) {
      .stats-row { grid-template-columns: repeat(3, 1fr); }
      .main-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  private reportService = inject(ReportService);
  private roomService = inject(RoomService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  
  summary: DashboardSummary | null = null;
  dues: OutstandingDue[] = [];
  loading = true;
  currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  public barChartOptions: ChartConfiguration['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } } },
      y: { grid: { display: false }, ticks: { color: '#475569', font: { size: 11, weight: 'bold' } } }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ 
      data: [], 
      backgroundColor: '#3b82f6', 
      borderRadius: 6, 
      barThickness: 12,
      hoverBackgroundColor: '#1e293b'
    }]
  };

  ngOnInit(): void { 
    this.loadDashboard(); 

    // Listen to global refresh (from Dashboard topbar)
    this.roomService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadDashboard());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    this.loading = true;
    
    forkJoin({
      summary: this.reportService.getDashboardSummary(),
      trends: this.reportService.getProfitTrend(6),
      dues: this.reportService.getOutstandingDues()
    }).subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.dues = res.dues;
        
        // Update Chart
        const labels = res.trends.trends.map(t => t.monthLabel.split(' ')[0]);
        const values = res.trends.trends.map(t => t.revenue);
        
        this.barChartData.labels = labels;
        this.barChartData.datasets[0].data = values;
        
        // Highlight last month with Emerald Green
        this.barChartData.datasets[0].backgroundColor = labels.map((_, i) => 
          i === labels.length - 1 ? '#10b981' : '#3b82f6'
        );

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading dashboard:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
