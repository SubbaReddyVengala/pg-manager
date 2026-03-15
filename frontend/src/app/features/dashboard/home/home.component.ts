import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="home-container">

      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <h2>Good day, {{ userName }}! 🏠</h2>
          <p>Welcome to your PG Management Dashboard.</p>
        </div>
        <div class="welcome-badge">{{ userRole }}</div>
      </div>

      <!-- Stat Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card" *ngFor="let stat of stats">
          <mat-card-content>
            <div class="stat-icon" [style.background]="stat.color">
              <mat-icon>{{ stat.icon }}</mat-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">--</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Coming Soon -->
      <mat-card class="coming-soon">
        <mat-card-content>
          <mat-icon>construction</mat-icon>
          <h3>Rooms, Tenants, and Payments coming in Phase 2</h3>
          <p>Your auth service is live and working. Next phase adds room management.</p>
        </mat-card-content>
      </mat-card>

    </div>
  `,
  styles: [`
    .home-container { max-width: 1200px; margin: 0 auto; }
    .welcome-banner {
      background: linear-gradient(135deg, #1B3A6B, #2471A3);
      border-radius: 12px; padding: 28px 32px;
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 24px; color: white;
    }
    .welcome-banner h2 { margin: 0 0 4px; font-size: 22px; }
    .welcome-banner p  { margin: 0; opacity: 0.8; }
    .welcome-badge {
      background: rgba(255,255,255,0.2);
      border-radius: 20px; padding: 6px 16px;
      font-size: 13px; font-weight: 600;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px; margin-bottom: 24px;
    }
    .stat-card mat-card-content {
      display: flex; align-items: center; gap: 16px; padding: 16px;
    }
    .stat-icon {
      width: 52px; height: 52px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon mat-icon { color: white; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1B3A6B; }
    .stat-label { font-size: 13px; color: #888; }
    .coming-soon mat-card-content {
      text-align: center; padding: 40px;
    }
    .coming-soon mat-icon { font-size: 48px; width: 48px; height: 48px; color: #2471A3; }
    .coming-soon h3 { margin: 12px 0 8px; color: #1B3A6B; }
    .coming-soon p  { color: #888; margin: 0; }
    @media (max-width: 600px) {
      .welcome-banner { flex-direction: column; gap: 16px; text-align: center; padding: 20px; }
    }
  `]
})
export class HomeComponent implements OnInit {
  userName = '';
  userRole = '';

  stats = [
    { label: 'Total Rooms',    icon: 'meeting_room',  color: '#2471A3' },
    { label: 'Active Tenants', icon: 'people',        color: '#148F77' },
    { label: 'Pending Dues',   icon: 'payments',      color: '#D35400' },
    { label: 'Open Issues',    icon: 'report_problem',color: '#C0392B' },
  ];

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.userName = this.auth.getUserName();
    this.userRole = this.auth.getUserRole();
  }
}
