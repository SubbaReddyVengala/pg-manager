import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ReportService, DashboardSummary, ProfitTrend, OutstandingDue } from '../../../core/services/report.service';
import { RoomService } from '../../../core/services/room.service';
import { catchError, forkJoin, of, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, RouterLink],
  template: `
    <div class="dashboard-home animate-in">
      
      <!-- ZERO DATA STATE (First time setup) -->
      <div class="zero-state" *ngIf="!loading && isCompletelyEmpty()">
        <div class="zero-content">
          <div class="icon-ring"><mat-icon>domain_add</mat-icon></div>
          <h2>Welcome to PG Manager</h2>
          <p>Your dashboard is empty because there are no rooms or tenants in the system yet. Let's get your PG set up.</p>
          <div class="action-buttons">
            <a mat-flat-button color="primary" routerLink="/dashboard/rooms" class="z-btn">1. Add Your Rooms</a>
            <a mat-stroked-button color="primary" routerLink="/dashboard/tenants" class="z-btn">2. Add Tenants</a>
          </div>
        </div>
      </div>

      <!-- DASHBOARD CONTENT -->
      <div class="dash-content" *ngIf="loading || !isCompletelyEmpty()">
        <!-- TOP STATS -->
        <div class="stats-grid">
          <ng-container *ngIf="!loading; else statsSkel">
            <div class="stat-card glass hover-lift occupancy-theme">
              <div class="st-icon-bg blue"><mat-icon>analytics</mat-icon></div>
              <div class="st-info">
                <div class="st-label">Occupancy</div>
                <div class="st-val">{{ summary?.occupancyRate || 0 | number:'1.0-0' }}%</div>
                <div class="st-sub">{{ summary?.occupiedRooms || 0 }} of {{ summary?.totalRooms || 0 }} beds</div>
              </div>
            </div>
            <div class="stat-card glass hover-lift tenants-theme">
              <div class="st-icon-bg purple"><mat-icon>groups</mat-icon></div>
              <div class="st-info">
                <div class="st-label">Active Tenants</div>
                <div class="st-val">{{ summary?.activeTenants || 0 }}</div>
                <div class="st-sub">{{ summary?.pendingTenants || 0 }} pending</div>
              </div>
            </div>
            <div class="stat-card glass hover-lift revenue-theme">
              <div class="st-icon-bg green"><mat-icon>payments</mat-icon></div>
              <div class="st-info">
                <div class="st-label">Revenue</div>
                <div class="st-val">₹{{ (summary?.monthlyRevenue || 0) | number }}</div>
                <div class="st-sub up">Monthly Total</div>
              </div>
            </div>
            <div class="stat-card glass hover-lift outstanding-theme">
              <div class="st-icon-bg red"><mat-icon>warning</mat-icon></div>
              <div class="st-info">
                <div class="st-label">Outstanding</div>
                <div class="st-val text-red">₹{{ (summary?.outstandingAmount || 0) | number }}</div>
                <div class="st-sub text-red">{{ summary?.overduePaymentsCount || 0 }} overdue</div>
              </div>
            </div>
          </ng-container>

          <ng-template #statsSkel>
            <div class="stat-card skel" *ngFor="let i of [1,2,3,4]"></div>
          </ng-template>
        </div>

        <!-- MAIN CONTENT GRID -->
        <div class="main-grid">
          <div class="charts-col">
            <!-- INCOME TREND SECTION -->
            <div class="chart-card glass trend-section">
              <div class="card-header">
                <div class="h-title">
                   <mat-icon>bar_chart</mat-icon>
                   <h3>Monthly Revenue Trend</h3>
                </div>
                <div class="period-picker">
                   <select [(ngModel)]="trendPeriod" (change)="loadDashboard()" class="sub-select">
                      <option [value]="3">Last 3 Months</option>
                      <option [value]="6">Last 6 Months</option>
                      <option [value]="12">Last 12 Months</option>
                   </select>
                </div>
              </div>
              <div class="chart-wrap">
                <div class="empty-chart" *ngIf="!hasChartData">
                   <mat-icon>insights</mat-icon>
                   <p>No revenue data available yet.</p>
                </div>
                
                <div class="css-chart" *ngIf="hasChartData">
                  <div class="css-bar-wrapper" *ngFor="let trend of trendData">
                    <div class="css-val">₹{{ trend.value / 1000 | number:'1.0-1' }}k</div>
                    <div class="css-bar-track">
                      <div class="css-bar-fill" 
                           [class.current]="trend.isCurrent" 
                           [style.height]="getPercentage(trend.value, maxTrendValue) + '%'">
                      </div>
                    </div>
                    <div class="css-label">{{ trend.label }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid-2-col">
               <!-- OCCUPANCY BREAKDOWN -->
               <div class="chart-card glass tiny occupancy-breakdown">
                 <h3>Occupancy Status</h3>
                 <div class="progress-container" *ngIf="summary && summary.totalRooms > 0; else noOcc">
                   <div class="progress-bar">
                     <div class="bar-fill occupied" [style.width]="getPercentage(summary.occupiedRooms, summary.totalRooms) + '%'"></div>
                     <div class="bar-fill available" [style.width]="getPercentage(summary.availableRooms, summary.totalRooms) + '%'"></div>
                   </div>
                   <div class="progress-legend">
                     <div class="leg-item"><span class="dot green"></span> {{ summary.occupiedRooms }} Occupied</div>
                     <div class="leg-item"><span class="dot blue"></span> {{ summary.availableRooms }} Vacant</div>
                   </div>
                 </div>
                 <ng-template #noOcc><p class="text-muted">No data.</p></ng-template>
               </div>

               <!-- QUICK ACTIONS -->
               <div class="chart-card glass tiny quick-actions-section">
                  <h3>Quick Actions</h3>
                  <div class="quick-btns">
                    <button routerLink="/dashboard/payments" class="q-btn">
                      <mat-icon>add_card</mat-icon> Record Rent
                    </button>
                    <button routerLink="/dashboard/tenants" class="q-btn">
                      <mat-icon>person_add</mat-icon> Add Tenant
                    </button>
                  </div>
               </div>
            </div>
          </div>

          <!-- ACTION QUEUE -->
          <div class="summary-col">
            <div class="action-queue-card glass action-queue-theme">
              <div class="card-header">
                <div class="h-title">
                   <mat-icon>bolt</mat-icon>
                   <h3>Action Queue</h3>
                </div>
              </div>
              <div class="empty-actions" *ngIf="!dues.length && (summary?.openMaintenanceTickets || 0) === 0">
                <div class="success-ring"><mat-icon>check</mat-icon></div>
                <p>Everything is up to date!</p>
              </div>
              <div class="action-list" *ngIf="dues.length > 0 || (summary?.openMaintenanceTickets || 0) > 0">
                <div class="action-item overdue" *ngFor="let d of dues">
                  <div class="action-icon"><mat-icon>priority_high</mat-icon></div>
                  <div class="action-body">
                    <span class="action-title">{{ d.tenantName }}</span>
                    <span class="action-desc">Rent overdue - Room {{ d.roomNumber }}</span>
                  </div>
                  <button class="action-btn-sm" routerLink="/dashboard/payments">Collect</button>
                </div>
                <div class="action-item maintenance" *ngIf="summary && summary.openMaintenanceTickets > 0">
                  <div class="action-icon"><mat-icon>build</mat-icon></div>
                  <div class="action-body">
                    <span class="action-title">Maintenance</span>
                    <span class="action-desc">{{ summary.openMaintenanceTickets }} pending tickets</span>
                  </div>
                  <button class="action-btn-sm" routerLink="/dashboard/maintenance">View</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-home { padding: 24px; background: transparent; min-height: 100vh; }
    
    .glass { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.5) !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important; }
    .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -10px rgba(0,0,0,0.1) !important; border-color: #3b82f6 !important; }

    /* Theme Accents */
    .occupancy-theme { background: linear-gradient(135deg, rgba(239, 246, 255, 0.8), rgba(255, 255, 255, 0.7)) !important; }
    .tenants-theme { background: linear-gradient(135deg, rgba(245, 243, 255, 0.8), rgba(255, 255, 255, 0.7)) !important; }
    .revenue-theme { background: linear-gradient(135deg, rgba(236, 253, 245, 0.8), rgba(255, 255, 255, 0.7)) !important; }
    .outstanding-theme { background: linear-gradient(135deg, rgba(255, 241, 242, 0.8), rgba(255, 255, 255, 0.7)) !important; }
    .trend-section { background: linear-gradient(to bottom, #ffffff, #f8fafc) !important; }
    .action-queue-theme { background: linear-gradient(to bottom, #ffffff, #f5f3ff) !important; }

    .sub-select { border: 1px solid #e2e8f0; background: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #475569; outline: none; cursor: pointer; }
    .sub-select:focus { border-color: #3b82f6; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
    .stat-card { display: flex; align-items: center; gap: 16px; padding: 24px; border-radius: 16px; }
    .st-icon-bg { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .st-icon-bg mat-icon { font-size: 24px; width: 24px; height: 24px; }
    
    .st-icon-bg.blue { background: #eff6ff; color: #3b82f6; }
    .st-icon-bg.purple { background: #f5f3ff; color: #8b5cf6; }
    .st-icon-bg.green { background: #ecfdf5; color: #10b981; }
    .st-icon-bg.red { background: #fef2f2; color: #ef4444; }

    .st-info { flex: 1; }
    .st-label { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .st-val { font-size: 24px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
    .st-sub { font-size: 11px; color: #94a3b8; font-weight: 500; }

    .main-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
    .grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    
    .chart-card { border-radius: 20px; padding: 24px; margin-bottom: 24px; }
    .chart-card.tiny { margin-bottom: 0; min-height: 160px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .h-title { display: flex; align-items: center; gap: 10px; color: #1e293b; }
    .h-title mat-icon { color: #3b82f6; }
    .chart-card h3 { margin: 0; font-size: 15px; font-weight: 700; }
    
    .css-chart { display: flex; align-items: flex-end; justify-content: space-around; height: 220px; padding-top: 20px; }
    .css-bar-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
    .css-bar-track { width: 32px; height: 160px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: flex-end; }
    .css-bar-fill { width: 100%; background: #94a3b8; border-radius: 6px; transition: height 1s cubic-bezier(0.4, 0, 0.2, 1); }
    .css-bar-fill.current { background: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .css-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

    .progress-bar { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; display: flex; margin: 20px 0 12px; }
    .bar-fill.occupied { background: #10b981; }
    .bar-fill.available { background: #3b82f6; }
    .progress-legend { display: flex; flex-direction: column; gap: 8px; }
    .leg-item { font-size: 12px; color: #475569; font-weight: 600; display: flex; align-items: center; gap: 8px; }

    .q-btn { display: flex; align-items: center; gap: 10px; background: #ffffff; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 12px; font-size: 13px; font-weight: 700; color: #1e293b; cursor: pointer; transition: 0.2s; text-align: left; width: 100%; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .q-btn:hover { border-color: #3b82f6; color: #3b82f6; transform: translateX(4px); }

    .action-queue-card { border-radius: 20px; padding: 24px; position: sticky; top: 24px; }
    .action-item { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 14px; background: white; border: 1px solid #f1f5f9; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
    .action-btn-sm { padding: 8px 14px; border-radius: 10px; border: none; background: #0f172a; font-size: 11px; font-weight: 700; color: #fff; cursor: pointer; transition: 0.2s; }
    .action-btn-sm:hover { background: #1e293b; transform: scale(1.05); }

    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .main-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr; }
      .grid-2-col { grid-template-columns: 1fr; }
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
  hasChartData = false;
  trendData: { label: string, value: number, isCurrent: boolean }[] = [];
  maxTrendValue = 1;
  trendPeriod = 6; // Default to 6 months

  ngOnInit(): void { 
    this.loadDashboard(); 
    this.roomService.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadDashboard());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  isCompletelyEmpty(): boolean {
    if (!this.summary) return true;
    return this.summary.totalRooms === 0 && this.summary.activeTenants === 0;
  }

  getPercentage(part: number, total: number): number {
    if (!total || total === 0) return 0;
    return (part / total) * 100;
  }

  loadDashboard(): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    const summaryObs = this.reportService.getDashboardSummary().pipe(catchError(() => of(null)));
    const trendsObs = this.reportService.getProfitTrend(this.trendPeriod).pipe(catchError(() => of({ trends: [] })));
    const duesObs = this.reportService.getOutstandingDues().pipe(catchError(() => of([])));

    forkJoin({
      summary: summaryObs,
      trends: trendsObs,
      dues: duesObs
    }).subscribe({
    next: (res: any) => {
    this.summary = res.summary;
    this.dues = res.dues || [];

    if (res.trends && res.trends.trends && res.trends.trends.length > 0) {
      const t = res.trends.trends;
      this.trendData = t.map((item: any, i: number) => ({
        label: item.monthLabel.split(' ')[0],
        value: item.revenue,
        isCurrent: i === t.length - 1
      }));
      this.maxTrendValue = Math.max(...this.trendData.map(d => d.value), 1);
      this.hasChartData = this.trendData.some(d => d.value > 0);
    } else {
      this.hasChartData = false;
    }

    this.loading = false;
    this.cdr.detectChanges();
    },
    error: () => { 
    this.loading = false; 
    this.cdr.detectChanges(); 
    }
    });
    }
    }

