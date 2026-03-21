import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { RoomService } from '../../../core/services/room.service';
import { RoomStats } from '../../../shared/models/room.models';
import { PaymentService } from '../../payments/payment.service';
import { PaymentStats } from '../../../shared/models/payment.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, MatProgressSpinnerModule],
  template: `
    <div class="home">
      <div class="welcome">
        <div>
          <h2>Good day, {{ userName }}! 🏠</h2>
          <p>Welcome to your PG Management Dashboard</p>
        </div>
        <div class="role-badge">{{ userRole }}</div>
      </div>
      <div class="loading-center" *ngIf="statsLoading">
        <mat-spinner diameter="32"></mat-spinner>
      </div>
      <div class="stats-grid" *ngIf="!statsLoading">
        <div class="stat-card" routerLink="/dashboard/rooms">
          <div class="stat-icon" style="background:#EFF6FF">
            <mat-icon style="color:#2563EB">meeting_room</mat-icon>
          </div>
          <div><div class="val">{{ stats?.totalRooms ?? 0 }}</div><div class="lbl">Total Rooms</div></div>
        </div>
        <div class="stat-card" routerLink="/dashboard/rooms">
          <div class="stat-icon" style="background:#FFF7ED">
            <mat-icon style="color:#D35400">door_front</mat-icon>
          </div>
          <div><div class="val">{{ stats?.occupied ?? 0 }}</div><div class="lbl">Occupied</div></div>
        </div>
        <div class="stat-card" routerLink="/dashboard/rooms">
          <div class="stat-icon" style="background:#F0FDF4">
            <mat-icon style="color:#1E8449">check_circle</mat-icon>
          </div>
          <div><div class="val">{{ stats?.available ?? 0 }}</div><div class="lbl">Available</div></div>
        </div>
        <div class="stat-card" routerLink="/dashboard/rooms">
          <div class="stat-icon" style="background:#FEF2F2">
            <mat-icon style="color:#C0392B">build</mat-icon>
          </div>
          <div><div class="val">{{ stats?.maintenance ?? 0 }}</div><div class="lbl">Maintenance</div></div>
        </div>

        <!-- Collected card -->
        <div class="stat-card" routerLink="/dashboard/payments">
          <div class="stat-icon" style="background:#E8F5E9">
            <mat-icon style="color:#2E7D32">payments</mat-icon>
          </div>
          <div>
            <div class="val">₹{{ paymentStats?.collected ?? 0 | number }}</div>
            <div class="lbl">Collected</div>
          </div>
        </div>

        <!-- Outstanding card -->
        <div class="stat-card" routerLink="/dashboard/payments">
          <div class="stat-icon" style="background:#FFEBEE">
            <mat-icon style="color:#C62828">money_off</mat-icon>
          </div>
          <div>
            <div class="val">₹{{ paymentStats?.outstanding ?? 0 | number }}</div>
            <div class="lbl">Outstanding</div>
          </div>
        </div>

        <div class="stat-card occ-card">
          <div class="occ-val">{{ stats?.occupancyRate ?? 0 }}%</div>
          <div class="occ-lbl">Occupancy Rate</div>
          <div class="occ-bar">
            <div class="occ-fill" [style.width]="(stats?.occupancyRate ?? 0) + '%'"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home { max-width:1200px; margin:0 auto; }
    .loading-center { display:flex; justify-content:center; padding:40px; }
    .welcome { background:linear-gradient(135deg,#1B3A6B,#2471A3); border-radius:12px;
      padding:28px 32px; display:flex; justify-content:space-between; align-items:center;
      margin-bottom:24px; color:white; }
    .welcome h2 { margin:0 0 4px; font-size:22px; font-weight:700; }
    .welcome p  { margin:0; opacity:0.8; font-size:14px; }
    .role-badge { background:rgba(255,255,255,0.2); border-radius:20px;
      padding:6px 16px; font-size:13px; font-weight:600; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
    .stat-card { background:#fff; border-radius:12px; padding:20px; display:flex;
      align-items:center; gap:16px; box-shadow:0 1px 3px rgba(0,0,0,0.08);
      cursor:pointer; transition:box-shadow 0.2s; }
    .stat-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.12); }
    .stat-icon { width:52px; height:52px; border-radius:12px; display:flex;
      align-items:center; justify-content:center; flex-shrink:0; }
    .val { font-size:28px; font-weight:700; color:#111827; }
    .lbl { font-size:13px; color:#6B7280; margin-top:2px; }
    .occ-card { flex-direction:column; align-items:flex-start; gap:8px; }
    .occ-val { font-size:32px; font-weight:800; color:#1B3A6B; }
    .occ-lbl { font-size:13px; color:#6B7280; }
    .occ-bar { width:100%; height:8px; background:#E5E7EB; border-radius:4px; overflow:hidden; }
    .occ-fill { height:100%; background:linear-gradient(90deg,#2471A3,#1B3A6B);
      border-radius:4px; transition:width 0.8s ease; }
    @media (max-width:600px) { .welcome { flex-direction:column; gap:12px; padding:20px; text-align:center; } }
  `]
})
export class HomeComponent implements OnInit {
  userName = ''; userRole = '';
  stats: RoomStats | null = null;
  paymentStats: PaymentStats | null = null;
  statsLoading = true;

  constructor(
    private auth: AuthService,
    private roomService: RoomService,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userName = this.auth.getUserName();
    this.userRole = this.auth.getUserRole();

    this.roomService.getStats().subscribe({
      next:  s  => { this.stats = s; this.statsLoading = false; this.cdr.detectChanges(); },
      error: () => { this.statsLoading = false; this.cdr.detectChanges(); }
    });

    const monthStr = new Date(
      new Date().getFullYear(), new Date().getMonth(), 1
    ).toISOString().split('T')[0];

    this.paymentService.getStats(monthStr).subscribe({
      next:  s  => { this.paymentStats = s; this.cdr.detectChanges(); },
      error: () => {}
    });
  }
}