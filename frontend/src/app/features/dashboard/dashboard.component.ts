import { Component, OnInit, HostListener, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { RoomService } from '../../core/services/room.service';
import { NotificationService } from '../../core/services/notification.service';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { SettingsService } from '../../core/services/settings.service';
import { filter, map, Subject, takeUntil, timer } from 'rxjs';

interface NavItem {
  label: string;
  icon:  string;
  route: string;
  color: string;
  badge?: number;
  exact?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatIconModule, MatButtonModule, MatDividerModule,
  ],
  template: `
    <div class="layout">

      <!-- OVERLAY (mobile only) -->
      <div class="overlay"
           *ngIf="isMobile && sidebarOpen"
           (click)="sidebarOpen = false">
      </div>

      <!-- SIDEBAR -->
      <aside class="sidebar" [class.sidebar-visible]="sidebarOpen">

        <!-- Brand -->
        <div class="brand">
          <div class="brand-logo">{{ brandInitial }}</div>
          <div class="brand-info">
            <span class="brand-name">{{ pgName }}</span>
            <span class="brand-role">Owner Account</span>
          </div>
        </div>

        <!-- Scrollable nav area -->
        <div class="nav-area">

          <a *ngFor="let item of mainNav"
             [routerLink]="item.route"
             routerLinkActive="nav-active"
             [routerLinkActiveOptions]="{exact: item.exact ?? false}"
             class="nav-item"
             (click)="isMobile && (sidebarOpen=false)">
            <mat-icon class="nav-icon" [style.color]="item.color">
              {{item.icon}}
            </mat-icon>
            <span class="nav-label">{{item.label}}</span>
            <span class="badge" *ngIf="item.badge">{{item.badge}}</span>
          </a>

          <div class="nav-divider"></div>

          <a *ngFor="let item of moreNav"
             [routerLink]="item.route"
             routerLinkActive="nav-active"
             [routerLinkActiveOptions]="{exact: false}"
             class="nav-item"
             (click)="isMobile && (sidebarOpen=false)">
            <mat-icon class="nav-icon" [style.color]="item.color">
              {{item.icon}}
            </mat-icon>
            <span class="nav-label">{{item.label}}</span>
            <span class="badge" *ngIf="getBadgeCount(item)">{{getBadgeCount(item)}}</span>
          </a>

        </div>

        <!-- Footer: user info + sign out -->
        <div class="sidebar-footer">
          <div class="footer-divider"></div>
          <div class="user-row">
            <div class="user-avatar">{{userInitial}}</div>
            <div class="user-info">
              <span class="user-email">{{userEmail}}</span>
              <span class="user-role">{{userRole}}</span>
            </div>
          </div>
          <button class="signout-btn" (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Sign Out</span>
          </button>
        </div>

      </aside>

      <!-- MAIN AREA -->
      <div class="main">

        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="hamburger" (click)="sidebarOpen = !sidebarOpen">
              <mat-icon>menu</mat-icon>
            </button>
            <div class="page-info">
              <h2 class="page-title">{{pageTitle}}</h2>
              <p class="page-sub">{{pageSubtitle}}</p>
            </div>
          </div>
          <div class="topbar-right">
            <span class="sync-status">
              <mat-icon>cloud_done</mat-icon>
              <span>Updated just now</span>
            </span>
            <button class="refresh-btn" (click)="onRefresh()" mat-icon-button title="Refresh data">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </header>
        <!-- Page content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .layout {
      display: flex; height: 100vh; overflow: hidden;
      background: #F8FAFC; position: relative;
    }
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4); z-index: 300; backdrop-filter: blur(4px);
    }
    .sidebar {
      width: 260px; min-width: 260px; height: 100vh;
      background: #0f172a; display: flex; flex-direction: column;
      z-index: 400; flex-shrink: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-right: 1px solid rgba(255,255,255,0.05);
    }
    @media (max-width: 767px) {
      .sidebar {
        position: fixed; left: 0; top: 0;
        transform: translateX(-100%); 
      }
      .sidebar.sidebar-visible { transform: translateX(0); }
    }
    @media (min-width: 768px) {
      .sidebar:not(.sidebar-visible) { margin-left: -260px; }
    }

    .brand {
      display: flex; align-items: center; gap: 14px;
      padding: 24px 20px; flex-shrink: 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .brand-logo {
      width: 42px; height: 42px; background: linear-gradient(135deg, #3B82F6, #10B981);
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 900; color: #fff; flex-shrink: 0;
      box-shadow: 0 8px 16px -4px rgba(59,130,246,0.5);
    }
    .brand-info { display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .brand-name { font-size: 14px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .brand-role { font-size: 10px; color: #94a3b8; margin-top: 1px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .nav-area { flex: 1; overflow-y: auto; padding: 12px 0; }
    .nav-area::-webkit-scrollbar { width: 0; }
    
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; margin: 2px 12px; border-radius: 10px;
      text-decoration: none; color: #94a3b8;
      font-size: 14px; font-weight: 600; cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .nav-item:hover { background: rgba(255,255,255,0.08); color: #ffffff; }
    .nav-item.nav-active { 
      background: #3B82F6 !important; 
      color: #ffffff !important; 
      box-shadow: 0 4px 12px rgba(59,130,246,0.3);
    }
    .nav-item.nav-active .nav-icon { color: #ffffff !important; }
    .nav-icon { font-size: 22px !important; width: 22px !important; height: 22px !important; flex-shrink: 0; }
    .nav-label { flex: 1; }
    
    .badge {
      background: #ef4444; color: #ffffff; border-radius: 8px;
      font-size: 10px; font-weight: 800; padding: 2px 6px;
      box-shadow: 0 2px 4px rgba(239,68,68,0.3);
    }
    
    .sidebar-footer { flex-shrink: 0; padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); }
    .user-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; min-width: 0; }
    .user-avatar {
      width: 36px; height: 36px; background: #1e293b; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800; color: #3b82f6; flex-shrink: 0;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .user-info { display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .user-email { font-size: 12px; color: #ffffff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    
    .signout-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 10px; border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; 
      background: transparent; color: #fca5a5; font-size: 12px; font-weight: 700;
      cursor: pointer; transition: 0.2s;
    }
    .signout-btn:hover { background: #ef4444; color: #ffffff; border-color: #ef4444; }

    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .topbar {
      height: 72px; background: #ffffff;
      border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; 
      justify-content: space-between; padding: 0 24px; flex-shrink: 0; z-index: 200;
    }
    .topbar-left { display: flex; align-items: center; gap: 16px; }
    .hamburger {
      background: #f8fafc; border: 1px solid #E2E8F0; border-radius: 10px; padding: 8px;
      cursor: pointer; color: #64748B; display: flex; align-items: center;
      transition: all 0.2s;
    }
    .hamburger:hover { background: #f1f5f9; color: #1e293b; }
    
    .page-info { display: flex; flex-direction: column; }
    .page-title { font-size: 18px; font-weight: 800; color: #0F172A; letter-spacing: -0.5px; margin: 0; }
    .page-sub   { font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    
    .topbar-right { display: flex; align-items: center; gap: 20px; }
    .sync-status {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600; color: #94A3B8;
    }
    .sync-status mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; color: #10B981; }
    
    .refresh-btn { 
      color: #64748B !important; width: 36px !important; height: 36px !important;
      background: #f8fafc !important; border: 1px solid #e2e8f0 !important;
    }
    .refresh-btn:hover { color: #3B82F6 !important; border-color: #3b82f6 !important; transform: rotate(180deg); }
    
    .page-content { 
      flex: 1; overflow-y: auto; padding: 32px;
      animation: pageIn 0.4s ease-out;
    }
    @keyframes pageIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @media (max-width: 767px) {
      .topbar { padding: 0 20px; }
      .topbar-right { display: none; }
      .page-content { padding: 20px; }
    }
  `]
})
export class DashboardComponent implements OnInit {

  sidebarOpen  = true;
  isMobile     = false;
  pageTitle    = 'Dashboard';
  pageSubtitle = '';
  userName     = '';
  userEmail    = '';
  userRole     = '';
  userInitial  = 'U';
  pgName       = 'PG Manager';
  brandInitial = 'PG';
  unreadCount  = 0;
  openMaintenanceCount = 0;
  private destroy$ = new Subject<void>();

  mainNav: NavItem[] = [
    { label:'Dashboard', icon:'dashboard',    route:'/dashboard',          color:'#3B82F6', exact:true  },
    { label:'Rooms',     icon:'meeting_room', route:'/dashboard/rooms',    color:'#8B5CF6', exact:false },
    { label:'Tenants',   icon:'people',       route:'/dashboard/tenants',  color:'#10B981', exact:false },
    { label:'Payments',  icon:'payments',     route:'/dashboard/payments', color:'#F59E0B', exact:false },
    { label:'Reports',   icon:'bar_chart',    route:'/dashboard/reports',  color:'#06B6D4', exact:false },
  ];

  moreNav: NavItem[] = [
    { label:'Maintenance',   icon:'build',         route:'/dashboard/maintenance', color:'#EF4444' },
    { label:'Expenses',      icon:'receipt_long',  route:'/dashboard/expenses',   color:'#F97316' },
    { label:'Notifications', icon:'notifications', route:'/dashboard/notifications', color:'#A855F7' },
    { label:'Settings',      icon:'settings',      route:'/dashboard/settings',   color:'#6B7280' },
  ];

  constructor(
    private auth:        AuthService,
    private router:      Router,
    private route:       ActivatedRoute,
    private roomService: RoomService,
    private notifService: NotificationService,
    private maintenanceService: MaintenanceService,
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.userName    = this.auth.getUserName();
    this.userEmail   = this.auth.getCurrentUserEmail();
    this.userRole    = this.auth.getUserRole();
    this.userInitial = this.userName.charAt(0).toUpperCase() || 'U';
    
    this.notifService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
        this.cdr.detectChanges();
      });
    
    // Poll for maintenance stats every 60 seconds
    timer(0, 60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadMaintenanceCount());
    
    this.listenToRouteChanges();

    // PG Name listener
    this.settingsService.pgName$
      .pipe(takeUntil(this.destroy$))
      .subscribe(name => {
        console.log('Dashboard received new PG name:', name);
        this.pgName = name;
        this.brandInitial = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        this.cdr.detectChanges();
      });

    // Maintenance refresh listener
    this.maintenanceService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadMaintenanceCount();
      });
  }

  listenToRouteChanges(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let child = this.route.firstChild;
        while (child?.firstChild) {
          child = child.firstChild;
        }
        return child?.snapshot.data;
      })
    ).subscribe(data => {
      if (data) {
        this.pageTitle = data['title'] || 'Dashboard';
        this.pageSubtitle = data['subtitle'] || '';
      }
    });

    // Initial load
    const data = this.route.snapshot.firstChild?.data;
    if (data) {
      this.pageTitle = data['title'] || 'Dashboard';
      this.pageSubtitle = data['subtitle'] || '';
    }
  }

  loadUnreadCount(): void {
    this.notifService.getUnreadCount().subscribe(count => {
      this.unreadCount = count;
    });
  }

  loadMaintenanceCount(): void {
    this.maintenanceService.getStats().subscribe(stats => {
      this.openMaintenanceCount = stats.openCount;
    });
  }

  getBadgeCount(item: NavItem): number {
    if (item.label === 'Notifications') return this.unreadCount;
    if (item.label === 'Maintenance') return this.openMaintenanceCount;
    return item.badge || 0;
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    const prev    = this.isMobile;
    this.isMobile = window.innerWidth < 768;
    if (!prev &&  this.isMobile) this.sidebarOpen = false;
    if ( prev && !this.isMobile) this.sidebarOpen = true;
  }

  // ✅ Refresh button handler — triggers reload in active page
  onRefresh(): void {
    this.roomService.triggerRefresh();
    this.notifService.triggerRefresh();
  }

  logout(): void { this.auth.logout(); }
}