import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardSummary {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  floorCount: number;

  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyProfit: number;
  outstandingAmount: number;
  revenueGrowthRate: number;

  activeTenants: number;
  pendingTenants: number;
  
  openMaintenanceTickets: number;
  overduePaymentsCount: number;
}

export interface OccupancyTrend {
  trends: {
    monthLabel: string;
    month: string;
    occupancyRate: number;
    totalTenants: number;
  }[];
}

export interface ProfitTrend {
  trends: {
    monthLabel: string;
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

export interface OutstandingDue {
  tenantName: string;
  roomNumber: string;
  amountDue: number;
  daysOverdue: number;
  lastReminder: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly API = environment.apiUrl + '/reports';

  constructor(private http: HttpClient) {}

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.API}/dashboard-summary`);
  }

  getOccupancyTrend(months: number = 6): Observable<OccupancyTrend> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<OccupancyTrend>(`${this.API}/trends/occupancy`, { params });
  }

  getProfitTrend(months: number = 6): Observable<ProfitTrend> {
    const params = new HttpParams().set('months', months.toString());
    return this.http.get<ProfitTrend>(`${this.API}/trends/profit`, { params });
  }

  getOutstandingDues(): Observable<OutstandingDue[]> {
    return this.http.get<OutstandingDue[]>(`${this.API}/outstanding-dues`);
  }

  exportPdf(month: string): Observable<Blob> {
    const params = new HttpParams().set('month', month);
    return this.http.get(`${this.API}/export/pdf`, { params, responseType: 'blob' });
  }

  exportExcel(month: string): Observable<Blob> {
    const params = new HttpParams().set('month', month);
    return this.http.get(`${this.API}/export/excel`, { params, responseType: 'blob' });
  }
}
