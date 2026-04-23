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
      
      <!-- TOP STATS: 2x3 Grid for better balance -->
      <div class="stats-grid" *ngIf="summary">
        <div class="stat-card">
          <div class="st-label">OCCUPANCY <mat-icon>analytics</mat-icon></div>
          <div class="st-val">{{ summary.occupancyRate }}%</div>
          <div class="st-sub" [class.up]="summary.occupancyRate >= 80">
            {{ summary.occupiedRooms }} / {{ summary.totalRooms }} beds occupied
          </div>
        </div>
        <div class="stat-card">
          <div class="st-label">ACTIVE TENANTS <mat-icon>groups</mat-icon></div>
          <div class="st-val">{{ summary.activeTenants }}</div>
          <div class="st-sub">{{ summary.pendingTenants }} joining soon</div>
        </div>
        <div class="stat-card">
          <div class="st-label">COLLECTED <mat-icon>payments</mat-icon></div>
          <div class="st-val">₹{{ summary.monthlyRevenue | number }}</div>
          <div class="st-sub up">↑ {{ summary.revenueGrowthRate }}% from last mo</div>
        </div>
        <div class="stat-card">
          <div class="st-label">PENDING DUE <mat-icon>warning</mat-icon></div>
          <div class="st-val text-red">₹{{ summary.outstandingAmount | number }}</div>
          <div class="st-sub text-red">{{ summary.overduePaymentsCount }} payments overdue</div>
        </div>
        <div class="stat-card">
          <div class="st-label">MAINTENANCE <mat-icon>build</mat-icon></div>
          <div class="st-val">{{ summary.maintenanceRooms }}</div>
          <div class="st-sub text-orange">{{ summary.openMaintenanceTickets }} open tickets</div>
        </div>
        <div class="stat-card">
          <div class="st-label">TOTAL FLOORS <mat-icon>layers</mat-icon></div>
          <div class="st-val">{{ summary.floorCount }}</div>
          <div class="st-sub">{{ summary.totalRooms }} total rooms</div>
        </div>
      </div>

      <!-- MAIN CONTENT GRID -->
      <div class="main-grid" *ngIf="summary">
        <div class="charts-col">
          <!-- INCOME TREND SECTION: Now Vertical -->
          <div class="chart-card trend-section">
            <div class="card-header">
              <h3>Monthly Revenue Trend</h3>
              <span class="period-label">Last 6 Months</span>
            </div>
            <div class="chart-wrap">
              <canvas baseChart
                [data]="barChartData"
                [options]="barChartOptions"
                [type]="barChartType">
              </canvas>
            </div>
          </div>

          <!-- OCCUPANCY BREAKDOWN -->
          <div class="chart-card occupancy-section">
            <h3>Occupancy Status</h3>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="bar-fill occupied" [style.width]="(summary.occupiedRooms / summary.totalRooms * 100) + '%'"></div>
                <div class="bar-fill available" [style.width]="(summary.availableRooms / summary.totalRooms * 100) + '%'"></div>
                <div class="bar-fill maintenance" [style.width]="(summary.maintenanceRooms / summary.totalRooms * 100) + '%'"></div>
              </div>
              <div class="progress-legend">
                <span class="leg-item"><span class="dot green"></span> {{ summary.occupiedRooms }} Occupied</span>
                <span class="leg-item"><span class="dot blue"></span> {{ summary.availableRooms }} Available</span>
                <span class="leg-item"><span class="dot orange"></span> {{ summary.maintenanceRooms }} Repair</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ACTION QUEUE (Replacing redundant summary) -->
        <div class="summary-col">
          <div class="action-queue-card">
            <h3>Today's Action Queue</h3>
            
            <div class="empty-actions" *ngIf="dues.length === 0 && summary.openMaintenanceTickets === 0">
              <mat-icon>check_circle</mat-icon>
              <p>Everything is up to date!</p>
            </div>

            <div class="action-list">
              <!-- Overdue Payments -->
              <div class="action-item overdue" *ngFor="let d of dues">
                <div class="action-icon"><mat-icon>priority_high</mat-icon></div>
                <div class="action-body">
                  <span class="action-title">Rent Overdue: {{ d.tenantName }}</span>
                  <span class="action-desc">Room {{ d.roomNumber }} · {{ d.daysOverdue }} days late</span>
                </div>
                <button class="action-btn">Remind</button>
              </div>

              <!-- Maintenance Alerts -->
              <div class="action-item maintenance" *ngIf="summary.openMaintenanceTickets > 0">
                <div class="action-icon"><mat-icon>build</mat-icon></div>
                <div class="action-body">
                  <span class="action-title">Maintenance Tickets</span>
                  <span class="action-desc">{{ summary.openMaintenanceTickets }} items need attention</span>
                </div>
                <button class="action-btn">View</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- LOADING OVERLAY -->
      <div class="loading-wrap" *ngIf="loading">
        <mat-spinner diameter="32"></mat-spinner>
        <p>Syncing Dashboard...</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-home { padding: 0; background: #f8fafc; min-height: 100vh; }
    
    /* Stats Grid: 2x3 balanced layout */
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 20px; 
      margin-bottom: 24px; 
    }
    .stat-card { 
      background: white; 
      padding: 24px; 
      border-radius: 12px; 
      border: 1px solid #e2e8f0; 
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

    .st-label { 
      font-size: 11px; font-weight: 700; color: #64748b; 
      letter-spacing: 0.5px; text-transform: uppercase;
      display: flex; justify-content: space-between; align-items: center; 
      margin-bottom: 12px; 
    }
    .st-label mat-icon { font-size: 18px; width: 18px; height: 18px; color: #94a3b8; }
    .st-val { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .st-sub { font-size: 12px; color: #64748b; font-weight: 500; }
    .st-sub.up { color: #10b981; font-weight: 600; }
    
    .text-red { color: #ef4444 !important; }
    .text-orange { color: #f59e0b !important; }

    /* Main Grid */
    .main-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
    
    .chart-card { 
      background: white; border-radius: 12px; padding: 24px; 
      border: 1px solid #e2e8f0; margin-bottom: 24px; 
    }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .chart-card h3 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
    .period-label { font-size: 12px; color: #94a3b8; font-weight: 500; }

    .progress-bar { height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; display: flex; margin: 16px 0 12px; }
    .bar-fill { height: 100%; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
    .bar-fill.occupied { background: #10b981; }
    .bar-fill.available { background: #3b82f6; }
    .bar-fill.maintenance { background: #f59e0b; }
    
    .progress-legend { display: flex; gap: 20px; }
    .leg-item { font-size: 12px; color: #64748b; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot.green { background: #10b981; }
    .dot.blue { background: #3b82f6; }
    .dot.orange { background: #f59e0b; }

    .chart-wrap { height: 300px; }

    /* Action Queue Card */
    .action-queue-card { 
      background: white; border-radius: 12px; padding: 24px; 
      border: 1px solid #e2e8f0; position: sticky; top: 24px; 
    }
    .action-queue-card h3 { margin: 0 0 20px; font-size: 15px; font-weight: 700; color: #1e293b; }
    
    .action-list { display: flex; flex-direction: column; gap: 12px; }
    .action-item { 
      display: flex; align-items: center; gap: 12px; 
      padding: 12px; border-radius: 10px; border: 1px solid #f1f5f9;
      background: #fafafa;
    }
    .action-icon { 
      width: 32px; height: 32px; border-radius: 8px; 
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .overdue .action-icon { background: #fff1f2; color: #ef4444; }
    .maintenance .action-icon { background: #fef3c7; color: #d97706; }
    
    .action-body { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .action-title { font-size: 12px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .action-desc { font-size: 11px; color: #64748b; margin-top: 1px; }
    
    .action-btn {
      padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0;
      background: white; font-size: 11px; font-weight: 600; color: #3b82f6;
      cursor: pointer; transition: all 0.2s;
    }
    .action-btn:hover { background: #f8fafc; border-color: #3b82f6; }

    .empty-actions { text-align: center; padding: 40px 0; color: #94a3b8; }
    .empty-actions mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; color: #d1d5db; }
    .empty-actions p { font-size: 13px; font-weight: 500; }

    .loading-wrap { position: fixed; inset: 0; background: rgba(255,255,255,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; gap: 12px; }
    .loading-wrap p { font-weight: 600; color: #64748b; font-size: 13px; letter-spacing: 0.5px; }

    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .main-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr; }
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
    indexAxis: 'x', // ✅ Vertical bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 13 },
        displayColors: false,
        callbacks: {
          label: (ctx) => ` ₹${(ctx.parsed.y ?? 0).toLocaleString()}`
        }
      }
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { color: '#64748b', font: { size: 11, weight: 600 } } 
      },
      y: { 
        grid: { color: '#f1f5f9' }, 
        ticks: { 
          color: '#94a3b8', 
          font: { size: 10, weight: 500 },
          callback: (value) => '₹' + (+value / 1000) + 'k'
        } 
      }
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
