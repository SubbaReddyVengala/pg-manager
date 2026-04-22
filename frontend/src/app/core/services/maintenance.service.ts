import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MaintenanceTicket {
  id: number;
  roomId: number;
  roomNumber: string;
  tenantId: number;
  tenantName: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  cost: number;
  reportedAt: string;
  startedAt?: string;
  resolvedAt?: string;
}

export interface MaintenanceStats {
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  avgResolutionTime: string;
}

export interface GeneralExpenseRequest {
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  note?: string;
}

export interface NetProfitResponse {
  month: string;
  totalRevenue: number;
  totalMaintenanceCost: number;
  totalGeneralExpenses: number;
  netProfit: number;
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private apiUrl = `${environment.apiUrl}/maintenance`;
  
  private refreshSubject = new Subject<void>();
  refresh$ = this.refreshSubject.asObservable();

  triggerRefresh(): void {
    this.refreshSubject.next();
  }

  constructor(private http: HttpClient) {}

  getTickets(status?: string): Observable<MaintenanceTicket[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<MaintenanceTicket[]>(`${this.apiUrl}/tickets`, { params });
  }

  getStats(): Observable<MaintenanceStats> {
    return this.http.get<MaintenanceStats>(`${this.apiUrl}/stats`);
  }

  raiseTicket(ticket: any): Observable<MaintenanceTicket> {
    return this.http.post<MaintenanceTicket>(`${this.apiUrl}/tickets`, ticket);
  }

  startWork(id: number): Observable<MaintenanceTicket> {
    return this.http.patch<MaintenanceTicket>(`${this.apiUrl}/tickets/${id}/start`, {});
  }

  resolveTicket(id: number, cost?: number): Observable<MaintenanceTicket> {
    let params = new HttpParams();
    if (cost) params = params.set('cost', cost.toString());
    return this.http.patch<MaintenanceTicket>(`${this.apiUrl}/tickets/${id}/resolve`, {}, { params });
  }

  recordExpense(expense: GeneralExpenseRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/expenses`, expense);
  }

  getExpenses(month: string): Observable<any[]> {
    let params = new HttpParams().set('month', month);
    return this.http.get<any[]>(`${this.apiUrl}/expenses`, { params });
  }

  getNetProfit(month: string): Observable<NetProfitResponse> {
    let params = new HttpParams().set('month', month);
    return this.http.get<NetProfitResponse>(`${this.apiUrl}/profit`, { params });
  }
}
