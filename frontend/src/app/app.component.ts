import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="impersonation-banner" *ngIf="auth.isImpersonating()">
      <div class="banner-content">
        <span class="dot"></span>
        <strong>Impersonating Mode:</strong> Viewing app as {{ auth.getUserName() }} ({{ auth.getCurrentUserEmail() }}). 
        All actions are audit-logged.
      </div>
      <button class="exit-btn" (click)="auth.stopImpersonating()">Exit Impersonation</button>
    </div>
    
    <router-outlet></router-outlet>
  `,
  styles: [`
    .impersonation-banner {
      background: #fff7ed;
      border-bottom: 1px solid #ffedd5;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #9a3412;
      font-size: 13px;
      position: sticky;
      top: 0;
      z-index: 9999;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .banner-content { display: flex; align-items: center; gap: 10px; }
    .dot { width: 8px; height: 8px; background: #f97316; border-radius: 50%; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .exit-btn {
      background: #f97316;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: 0.2s;
    }
    .exit-btn:hover { background: #ea580c; }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
}
