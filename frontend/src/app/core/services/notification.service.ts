import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, switchMap, of, catchError, tap, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NotificationAlert {
  id: number;
  title: string;
  message: string;
  type: 'OVERDUE' | 'MAINTENANCE' | 'PAYMENT' | 'REMINDER' | 'MOVE_OUT';
  recipient?: string;
  tenantId?: number;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private refreshSubject = new Subject<void>();
  refresh$ = this.refreshSubject.asObservable();

  constructor(private http: HttpClient) {
    // Poll for unread count every 30 seconds, handle errors gracefully
    timer(0, 30000).pipe(
      switchMap(() => this.getUnreadCount().pipe(
        catchError(() => of(0))
      ))
    ).subscribe(count => this.unreadCountSubject.next(count));
  }

  triggerRefresh(): void {
    this.getUnreadCount().subscribe(c => this.unreadCountSubject.next(c));
    this.refreshSubject.next();
  }

  sendNotification(request: any): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/send`, request);
  }

  getAlerts(): Observable<NotificationAlert[]> {
    return this.http.get<NotificationAlert[]>(`${this.apiUrl}/alerts`).pipe(
      catchError(() => of([]))
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`);
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-read`, {}).pipe(
      tap(() => {
        this.unreadCountSubject.next(0);
        this.refreshSubject.next();
      }),
      catchError(() => of(undefined))
    ) as unknown as Observable<void>;
  }
}
