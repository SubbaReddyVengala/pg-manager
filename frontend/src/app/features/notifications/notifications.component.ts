import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService, NotificationAlert } from '../../core/services/notification.service';
import { RoomService } from '../../core/services/room.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Subject, takeUntil } from 'rxjs';
import { formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, EmptyStateComponent],
  template: `
    <div class="notif-container">
      <div class="header">
        <div>
          <p class="subtitle">Stay updated on payments, maintenance, and alerts.</p>
        </div>
        <button mat-stroked-button color="default" (click)="markAllAsRead()" [disabled]="unreadCount === 0">
          Mark All Read
        </button>
      </div>

      <!-- FILTER TABS -->
      <div class="filter-tabs">
        <button class="tab-btn" [class.active]="activeTab === 'unread'" (click)="setTab('unread')">
          Unread <span class="tab-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'all'" (click)="setTab('all')">
          All History
        </button>
      </div>

      <div class="loading-center" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div class="notif-list" *ngIf="!loading">
        <div *ngFor="let n of filteredAlerts" class="notif-card" [class.unread]="!n.isRead" [style.border-left-color]="getTypeColor(n.type)">
          <div class="icon-wrap" [style.background-color]="getTypeBg(n.type)">
            <mat-icon [style.color]="getTypeColor(n.type)">{{ getTypeIcon(n.type) }}</mat-icon>
          </div>
          <div class="notif-content">
            <div class="notif-header">
              <h3 class="notif-title">{{ n.title }}</h3>
              <span class="notif-time">{{ getTimeAgo(n.createdAt) }}</span>
            </div>
            <p class="notif-msg">{{ n.message }}</p>
            <div class="notif-actions" *ngIf="n.type === 'OVERDUE'">
               <button mat-flat-button color="primary" class="action-btn email-btn" (click)="resendEmail(n)">
                 <mat-icon>mail</mat-icon> Resend Email
               </button>
            </div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="alerts.length === 0">
          <app-empty-state
            icon="notifications_off"
            title="All caught up!"
            description="You have no new notifications. We'll alert you here when there are updates on payments, maintenance, or tenant move-outs."
            padding="60px 20px"
          ></app-empty-state>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notif-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #1e293b; }
    .subtitle { margin: 4px 0 0; color: #64748b; font-size: 14px; }

    .filter-tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; }
    .tab-btn { 
      background: none; border: none; padding: 8px 16px; font-size: 14px; font-weight: 600; 
      color: #64748b; cursor: pointer; border-radius: 8px; transition: all 0.2s;
      display: flex; align-items: center; gap: 8px;
    }
    .tab-btn:hover { background: #f1f5f9; color: #1e293b; }
    .tab-btn.active { background: #1e293b; color: #fff; }
    .tab-badge { background: #ef4444; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 10px; }

    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .notif-list { display: flex; flex-direction: column; gap: 16px; }

    .notif-card { 
      background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; border-left: 6px solid #cbd5e1;
      display: flex; gap: 16px; padding: 16px; transition: transform 0.2s, box-shadow 0.2s;
    }
    .notif-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .notif-card.unread { background: #fdfdfd; }

    .icon-wrap { 
      width: 48px; height: 48px; border-radius: 10px; display: flex; 
      align-items: center; justify-content: center; flex-shrink: 0;
    }
    .notif-content { flex: 1; }
    .notif-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .notif-title { margin: 0; font-size: 16px; font-weight: 700; color: #1e293b; }
    .notif-time { font-size: 12px; color: #94a3b8; }
    .notif-msg { margin: 0; font-size: 14px; color: #475569; line-height: 1.5; }

    .notif-actions { display: flex; gap: 12px; margin-top: 16px; }
    .action-btn { height: 32px; font-size: 12px; font-weight: 600; }
    .email-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .empty-state { text-align: center; padding: 100px 0; color: #94a3b8; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; opacity: 0.3; margin-bottom: 16px; }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  alerts: NotificationAlert[] = [];
  filteredAlerts: NotificationAlert[] = [];
  unreadCount = 0;
  loading = true;
  activeTab: 'unread' | 'all' = 'unread';

  private notificationService = inject(NotificationService);
  private roomService = inject(RoomService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadAll();

    // Wire up global refresh button
    this.roomService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadAll());

    this.notificationService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadAll());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAll(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.notificationService.getAlerts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => {
        this.alerts = data;
        this.unreadCount = data.filter(n => !n.isRead).length;
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load notifications.', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllRead().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.notificationService.triggerRefresh();
      this.snackBar.open('All marked as read.', 'Close', { duration: 2000 });
    });
  }

  setTab(tab: 'unread' | 'all'): void {
    this.activeTab = tab;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.activeTab === 'unread') {
      this.filteredAlerts = this.alerts.filter(n => !n.isRead);
    } else {
      this.filteredAlerts = [...this.alerts];
    }
  }

  getTimeAgo(dateStr: string): string {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'OVERDUE': return 'notifications_active';
      case 'MAINTENANCE': return 'build';
      case 'PAYMENT': return 'check_circle';
      case 'MOVE_OUT': return 'outbox';
      default: return 'calendar_month';
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'OVERDUE': return '#ef4444';
      case 'MAINTENANCE': return '#f59e0b';
      case 'PAYMENT': return '#22c55e';
      case 'MOVE_OUT': return '#a855f7';
      default: return '#3b82f6';
    }
  }

  getTypeBg(type: string): string {
    switch (type) {
      case 'OVERDUE': return '#fef2f2';
      case 'MAINTENANCE': return '#fffbeb';
      case 'PAYMENT': return '#f0fdf4';
      case 'MOVE_OUT': return '#f5f3ff';
      default: return '#eff6ff';
    }
  }

  resendEmail(n: NotificationAlert): void {
    this.notificationService.sendNotification({
      recipient: n.recipient,
      subject: n.title,
      message: n.message,
      type: 'EMAIL',
      tenantId: n.tenantId
    }).subscribe(() => {
      this.snackBar.open('Email reminder resent!', 'Close', { duration: 2000 });
    });
  }
}
