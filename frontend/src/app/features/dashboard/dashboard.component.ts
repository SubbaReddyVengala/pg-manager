import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon:  string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule,
    MatDividerModule, MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">

      <!-- SIDEBAR -->
      <mat-sidenav #sidenav
        [mode]="isMobile ? 'over' : 'side'"
        [opened]="!isMobile"
        class="sidenav">

        <!-- Sidebar Brand -->
        <div class="sidenav-brand">
          <div class="brand-logo">
            <mat-icon>apartment</mat-icon>
          </div>
          <div class="brand-text">
            <span class="brand-title">PG Manager</span>
            <span class="brand-role">{{ userRole }}</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Nav Items -->
        <mat-nav-list class="nav-list">
          <a mat-list-item
             *ngFor="let item of navItems"
             [routerLink]="item.route"
             routerLinkActive="active-link"
             (click)="isMobile && sidenav.close()"
             class="nav-item">
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </mat-nav-list>

      </mat-sidenav>

      <!-- MAIN CONTENT -->
      <mat-sidenav-content class="main-content">

        <!-- TOPBAR -->
        <mat-toolbar class="topbar" color="primary">
          <button mat-icon-button (click)="sidenav.toggle()" class="menu-btn">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="topbar-title">{{ pageTitle }}</span>
          <span class="spacer"></span>

          <!-- User Menu -->
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <div class="user-avatar">{{ userInitial }}</div>
            <span class="user-name" *ngIf="!isMobile">{{ userName }}</span>
            <mat-icon>arrow_drop_down</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="menu-header">
              <strong>{{ userName }}</strong>
              <small>{{ userRole }}</small>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign out</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <!-- PAGE CONTENT -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>

      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }

    .sidenav {
      width: 256px;
      background: #1B3A6B;
      color: white;
    }
    .sidenav-brand {
      display: flex; align-items: center; gap: 12px;
      padding: 20px 16px;
    }
    .brand-logo {
      width: 40px; height: 40px; background: rgba(255,255,255,0.15);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
    }
    .brand-logo mat-icon { color: white; font-size: 22px; width: 22px; height: 22px; }
    .brand-title { font-size: 16px; font-weight: 700; color: white; display: block; }
    .brand-role  { font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; }

    .nav-list { padding: 8px 0; }
    .nav-item {
      border-radius: 8px !important;
      margin: 2px 8px !important;
      color: rgba(255,255,255,0.85) !important;
    }
    .nav-item:hover { background: rgba(255,255,255,0.1) !important; color: white !important; }
    .active-link { background: rgba(255,255,255,0.15) !important; color: white !important; }

    .topbar {
      background: #1B3A6B !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      position: sticky; top: 0; z-index: 100;
    }
    .topbar-title { font-size: 18px; font-weight: 600; margin-left: 8px; }
    .spacer { flex: 1 1 auto; }

    .user-btn { display: flex; align-items: center; gap: 8px; color: white; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px;
    }
    .user-name { font-size: 14px; }
    .menu-header { padding: 12px 16px; }
    .menu-header small { display: block; color: #888; font-size: 12px; }

    .main-content { display: flex; flex-direction: column; background: #F4F6F7; }
    .page-content { flex: 1; padding: 24px; overflow-y: auto; }

    @media (max-width: 768px) {
      .page-content { padding: 16px; }
    }
  `]
})
export class DashboardComponent implements OnInit {

  isMobile = false;
  pageTitle  = 'Dashboard';
  userName   = '';
  userRole   = '';
  userInitial = '';

  navItems: NavItem[] = [
    { label: 'Dashboard',     icon: 'dashboard',    route: '/dashboard' },
    { label: 'Rooms',         icon: 'meeting_room', route: '/dashboard/rooms' },
    { label: 'Tenants',       icon: 'people',       route: '/dashboard/tenants' },
    { label: 'Payments',      icon: 'payments',     route: '/dashboard/payments' },
    { label: 'Complaints',    icon: 'report_problem',route: '/dashboard/complaints' },
    { label: 'Expenses',      icon: 'receipt_long', route: '/dashboard/expenses' },
    { label: 'Reports',       icon: 'bar_chart',    route: '/dashboard/reports' },
    { label: 'Settings',      icon: 'settings',     route: '/dashboard/settings' },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.userName    = this.auth.getUserName();
    this.userRole    = this.auth.getUserRole();
    this.userInitial = this.userName.charAt(0).toUpperCase();
  }

  @HostListener('window:resize')
  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  logout(): void {
    this.auth.logout();
  }
}
