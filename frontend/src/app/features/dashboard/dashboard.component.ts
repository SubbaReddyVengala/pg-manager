import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import { RoomService } from '../../core/services/room.service';

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
          <div class="brand-avatar">PG</div>
          <div>
            <span class="brand-name">PG Manager</span>
            <span class="brand-sub">Management System</span>
          </div>
        </div>

        <!-- Scrollable nav area -->
        <div class="nav-area">

          <p class="section-label">MAIN MENU</p>
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

          <p class="section-label" style="margin-top:16px">MORE</p>
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
            <span class="badge" *ngIf="item.badge">{{item.badge}}</span>
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
          <div class="footer-gap"></div>
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
            <span class="live-pill">
              <span class="live-dot"></span>Live
            </span>
            <!-- ✅ Refresh button now wired up -->
            <button class="refresh-pill" (click)="onRefresh()">
              <mat-icon>refresh</mat-icon>Refresh
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .layout {
      display: flex; height: 100vh; overflow: hidden;
      background: #F0F2F5; position: relative;
    }
    .overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45); z-index: 300;
    }
    .sidebar {
      width: 224px; min-width: 224px; height: 100vh;
      background: #1A2540; display: flex; flex-direction: column;
      z-index: 400; flex-shrink: 0; transition: margin-left 0.28s ease;
    }
    @media (max-width: 767px) {
      .sidebar {
        position: fixed; left: 0; top: 0;
        transform: translateX(-100%); transition: transform 0.28s ease;
      }
      .sidebar.sidebar-visible { transform: translateX(0); }
    }
    @media (min-width: 768px) {
      .sidebar:not(.sidebar-visible) { margin-left: -224px; }
    }
    .brand {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.07); flex-shrink: 0;
    }
    .brand-avatar {
      width: 38px; height: 38px; background: #3B82F6; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 800; color: #fff; flex-shrink: 0;
    }
    .brand-name { display: block; font-size: 14px; font-weight: 700; color: #fff; }
    .brand-sub  { display: block; font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; }
    .nav-area { flex: 1; overflow-y: auto; padding: 14px 0 8px; }
    .nav-area::-webkit-scrollbar { width: 0; }
    .section-label {
      font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3);
      letter-spacing: 1.2px; padding: 0 16px 8px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 11px;
      padding: 11px 14px; margin: 3px 10px; border-radius: 9px;
      text-decoration: none; color: rgba(255,255,255,0.55);
      font-size: 13px; font-weight: 500; cursor: pointer;
      transition: background 0.18s, color 0.18s;
    }
    .nav-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.9); }
    .nav-item.nav-active { background: rgba(59,130,246,0.18); color: #fff; font-weight: 600; }
    .nav-icon { font-size: 19px !important; width: 19px !important; height: 19px !important; flex-shrink: 0; }
    .nav-label { flex: 1; }
    .badge {
      background: #EF4444; color: #fff; border-radius: 12px;
      font-size: 10px; font-weight: 700; padding: 2px 7px; line-height: 1.4;
    }
    .sidebar-footer { flex-shrink: 0; padding: 0 0 10px; }
    .footer-divider { height: 1px; background: rgba(255,255,255,0.08); }
    .user-row { display: flex; align-items: center; gap: 10px; padding: 14px 14px 10px; }
    .user-avatar {
      width: 34px; height: 34px; background: #3B82F6; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .user-email {
      display: block; font-size: 11px; color: rgba(255,255,255,0.8);
      font-weight: 500; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; max-width: 140px;
    }
    .user-role {
      display: block; font-size: 10px; color: rgba(255,255,255,0.35);
      text-transform: uppercase; letter-spacing: 0.6px; margin-top: 1px;
    }
    .footer-gap { height: 12px; }
    .signout-btn {
      display: flex; align-items: center; gap: 9px;
      width: calc(100% - 20px); margin: 0 10px; padding: 10px 14px;
      border: none; border-radius: 9px; background: transparent;
      color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: background 0.18s, color 0.18s;
    }
    .signout-btn mat-icon { font-size: 18px !important; width: 18px !important; height: 18px !important; }
    .signout-btn:hover { background: rgba(239,68,68,0.22); color: #EF4444; }
    .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .topbar {
      height: 62px; background: #fff; border-bottom: 1px solid #E5E7EB;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 20px; flex-shrink: 0;
    }
    .topbar-left { display: flex; align-items: center; gap: 12px; }
    .hamburger {
      background: none; border: none; border-radius: 8px; padding: 6px;
      cursor: pointer; color: #374151; display: flex; align-items: center;
      transition: background 0.18s;
    }
    .hamburger:hover { background: #F3F4F6; }
    .page-title { font-size: 17px; font-weight: 700; color: #111827; line-height: 1.2; }
    .page-sub   { font-size: 12px; color: #14B8A6; font-weight: 500; margin-top: 1px; }
    .topbar-right { display: flex; align-items: center; gap: 10px; }
    .live-pill {
      display: flex; align-items: center; gap: 6px;
      background: #ECFDF5; border: 1px solid #6EE7B7; border-radius: 20px;
      padding: 5px 13px; font-size: 12px; font-weight: 600; color: #059669;
    }
    .live-dot {
      width: 7px; height: 7px; background: #10B981;
      border-radius: 50%; animation: blink 1.6s infinite;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
    .refresh-pill {
      display: flex; align-items: center; gap: 5px;
      border: 1px solid #D1D5DB; border-radius: 8px; background: none;
      padding: 5px 12px; font-size: 12px; font-weight: 500; color: #374151;
      cursor: pointer; transition: background 0.18s;
    }
    .refresh-pill mat-icon { font-size: 15px !important; width: 15px !important; height: 15px !important; }
    .refresh-pill:hover { background: #F3F4F6; }
    .page-content { flex: 1; overflow-y: auto; padding: 24px; }
    @media (max-width: 767px) {
      .topbar-right { display: none; }
      .page-sub     { display: none; }
      .page-content { padding: 16px; }
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

  mainNav: NavItem[] = [
    { label:'Dashboard', icon:'dashboard',    route:'/dashboard',          color:'#3B82F6', exact:true  },
    { label:'Rooms',     icon:'meeting_room', route:'/dashboard/rooms',    color:'#8B5CF6', exact:false },
    { label:'Tenants',   icon:'people',       route:'/dashboard/tenants',  color:'#10B981', exact:false },
    { label:'Payments',  icon:'payments',     route:'/dashboard/payments', color:'#F59E0B', exact:false },
    { label:'Reports',   icon:'bar_chart',    route:'/dashboard/reports',  color:'#06B6D4', exact:false },
  ];

  moreNav: NavItem[] = [
    { label:'Maintenance',   icon:'build',         route:'/dashboard/complaints', color:'#EF4444', badge:3 },
    { label:'Expenses',      icon:'receipt_long',  route:'/dashboard/expenses',   color:'#F97316' },
    { label:'Notifications', icon:'notifications', route:'/dashboard/settings',   color:'#A855F7', badge:2 },
    { label:'Settings',      icon:'settings',      route:'/dashboard/settings',   color:'#6B7280' },
  ];

  constructor(
    private auth:        AuthService,
    private router:      Router,
    private roomService: RoomService   // ✅ injected for refresh
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.userName    = this.auth.getUserName();
    this.userEmail   = this.auth.getCurrentUserEmail();
    this.userRole    = this.auth.getUserRole();
    this.userInitial = this.userName.charAt(0).toUpperCase() || 'U';
    const now = new Date();
    this.pageSubtitle = now.toLocaleString('default', { month:'long' })
                        + ' ' + now.getFullYear() + ' \u2014 Hub Overview';
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
  }

  logout(): void { this.auth.logout(); }
}