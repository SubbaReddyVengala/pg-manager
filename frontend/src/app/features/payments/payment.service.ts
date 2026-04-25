import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentResponse, PaymentRequest,
  PaymentStats, GenerateDuesRequest
} from '../../shared/models/payment.models';
import { TenantResponse, PaginatedResponse } from '../../shared/models/tenant.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/payments`;
  private tenantBase = `${environment.apiUrl}/tenants`;

  // ── Main table (Paginated) ────────────────────────────────────────────
  getByMonth(month: string, page: number = 0, size: number = 20, status?: string, search?: string, sort?: string): Observable<PaginatedResponse<PaymentResponse>> {
    let params = new HttpParams()
      .set('month', month)
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (status && status !== 'ALL') params = params.set('status', status);
    if (search) params = params.set('search', search);
    if (sort) params = params.set('sort', sort);

    return this.http.get<PaginatedResponse<PaymentResponse>>(this.base, { params });
  }

  // Helper for non-paginated fetch (e.g. for Quick Collect which needs all pending)
  getAllPendingForMonth(month: string): Observable<PaginatedResponse<PaymentResponse>> {
     return this.getByMonth(month, 0, 500, 'PENDING'); // Large size for bulk ops
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
    const params = new HttpParams()
      .set('status', 'ACTIVE')
      .set('size', '100'); // Get more than default 20 to fill dropdown
    return this.http.get<any>(this.tenantBase, { params }).pipe(
      map(res => res.content || [])
    );
  }
}
