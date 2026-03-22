import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MonthlyReport, AnnualSummary } from '../../shared/models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reports`;

  getMonthlyReport(month: string): Observable<MonthlyReport> {
    const params = new HttpParams().set('month', month);
    return this.http.get<MonthlyReport>(`${this.base}/monthly`, { params });
  }

  getAnnualSummary(year: number): Observable<AnnualSummary> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<AnnualSummary>(`${this.base}/annual`, { params });
  }

  exportPdf(month: string): Observable<Blob> {
    const params = new HttpParams().set('month', month);
    return this.http.get(`${this.base}/monthly/export/pdf`,
      { params, responseType: 'blob' });
  }

  exportExcel(month: string): Observable<Blob> {
    const params = new HttpParams().set('month', month);
    return this.http.get(`${this.base}/monthly/export/excel`,
      { params, responseType: 'blob' });
  }
}
