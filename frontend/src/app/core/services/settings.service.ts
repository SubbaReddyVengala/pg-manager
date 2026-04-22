import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

export interface PgSettings {
  id?: number;
  pgName: string;
  ownerName: string;
  phone: string;
  address: string;
  whatsappReminders: boolean;
  emailNotifications: boolean;
  overdueAlerts: boolean;
  maintenanceAlerts: boolean;
  monthlyReportEmail: boolean;
  defaultRentDueDay: number;
  lateFeeAfterDays: number;
  lateFeeAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = `${environment.apiUrl}/settings`;
  private titleService = inject(Title);
  
  private pgNameSubject = new ReplaySubject<string>(1);
  pgName$ = this.pgNameSubject.asObservable();

  constructor(private http: HttpClient) {
    this.pgNameSubject.next('PG Manager');
    this.getSettings().subscribe(settings => {
      if (settings?.pgName) {
        this.updateLocalName(settings.pgName);
      }
    });
  }

  getSettings(): Observable<PgSettings> {
    return this.http.get<PgSettings>(this.apiUrl);
  }

  updateSettings(settings: PgSettings): Observable<PgSettings> {
    return this.http.put<PgSettings>(this.apiUrl, settings).pipe(
      tap(updated => {
        if (updated.pgName) {
          this.updateLocalName(updated.pgName);
        }
      })
    );
  }

  updateLocalName(name: string): void {
    this.pgNameSubject.next(name);
    this.titleService.setTitle(name);
  }
}
