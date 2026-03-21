import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentResponse, PaymentRequest,
  PaymentStats, GenerateDuesRequest
} from '../../shared/models/payment.models';
import { TenantResponse } from '../../shared/models/tenant.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/payments`;
  private tenantBase = `${environment.apiUrl}/tenants`;

  // ── Main table ────────────────────────────────────────────────────────
  getByMonth(month: string, status?: string): Observable<PaymentResponse[]> {
    let params = new HttpParams().set('month', month);
    if (status && status !== 'ALL') params = params.set('status', status);
    return this.http.get<PaymentResponse[]>(this.base, { params });
  }

  // ── 4 Stat cards ──────────────────────────────────────────────────────
  getStats(month: string): Observable<PaymentStats> {
    const params = new HttpParams().set('month', month);
    return this.http.get<PaymentStats>(`${this.base}/stats`, { params });
  }

  // ── Record payment (drawer form) ──────────────────────────────────────
  record(req: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.base, req);
  }

  // ── Generate dues manually ────────────────────────────────────────────
  generateDues(req: GenerateDuesRequest): Observable<string> {
    return this.http.post(`${this.base}/generate-dues`, req,
      { responseType: 'text' });
  }

  // ── Download PDF receipt ──────────────────────────────────────────────
  downloadReceipt(paymentId: number): Observable<Blob> {
  return this.http.get(`${this.base}/${paymentId}/receipt`,
    { responseType: 'blob' });
}

  // ── Payment history for tenant detail page ────────────────────────────
  getByTenant(tenantId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.base}/tenant/${tenantId}`);
  }

  // ── Active tenants for dropdown in Record Payment form ────────────────
  getActiveTenants(): Observable<TenantResponse[]> {
    const params = new HttpParams().set('status', 'ACTIVE');
    return this.http.get<TenantResponse[]>(this.tenantBase, { params });
  }
}
