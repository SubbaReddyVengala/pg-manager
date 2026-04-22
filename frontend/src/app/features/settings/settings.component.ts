import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { SettingsService, PgSettings } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule, MatSnackBarModule, 
    MatIconModule, MatSlideToggleModule, MatDividerModule
  ],
  template: `
    <div class="settings-page">
      <div class="settings-grid">
        <!-- LEFT COLUMN -->
        <div class="column">
          <!-- PG PROFILE -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">business</mat-icon>
              <mat-card-title>PG Profile</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="profileForm" class="settings-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>PG Name *</mat-label>
                  <input matInput formControlName="pgName">
                  <mat-error *ngIf="profileForm.get('pgName')?.invalid">Required</mat-error>
                </mat-form-field>

                <div class="row">
                  <mat-form-field appearance="outline">
                    <mat-label>Owner Name *</mat-label>
                    <input matInput formControlName="ownerName">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Phone *</mat-label>
                    <input matInput formControlName="phone">
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Address *</mat-label>
                  <textarea matInput formControlName="address" rows="2"></textarea>
                </mat-form-field>

                <div class="action-row">
                  <button mat-flat-button color="primary" [disabled]="loading || profileForm.invalid" (click)="saveSettings()">
                    {{ loading ? 'Saving...' : 'Save Profile' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- PAYMENT SETTINGS -->
          <mat-card class="section-card" style="margin-top: 24px;">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">payments</mat-icon>
              <mat-card-title>Payment Settings</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="paymentForm" class="settings-form">
                <div class="setting-item">
                  <div class="item-info">
                    <p class="item-label">Default Rent Due Day</p>
                    <p class="item-sub">1st of every month</p>
                  </div>
                  <mat-form-field appearance="outline" style="width: 120px;">
                    <mat-select formControlName="defaultRentDueDay">
                      <mat-option [value]="1">1st</mat-option>
                      <mat-option [value]="5">5th</mat-option>
                      <mat-option [value]="10">10th</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="setting-item">
                  <div class="item-info">
                    <p class="item-label">Late Fee After (days)</p>
                    <p class="item-sub">Charge late fee after X days overdue</p>
                  </div>
                  <mat-form-field appearance="outline" style="width: 120px;">
                    <input matInput type="number" formControlName="lateFeeAfterDays">
                  </mat-form-field>
                </div>

                <div class="setting-item">
                  <div class="item-info">
                    <p class="item-label">Late Fee Amount (₹)</p>
                    <p class="item-sub">Fixed amount per day</p>
                  </div>
                  <mat-form-field appearance="outline" style="width: 120px;">
                    <input matInput type="number" formControlName="lateFeeAmount">
                  </mat-form-field>
                </div>

                <div class="action-row">
                  <button mat-flat-button color="primary" [disabled]="loading || paymentForm.invalid" (click)="saveSettings()">
                    Save Payment Rules
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="column">
          <!-- NOTIFICATION SETTINGS -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-icon mat-card-avatar color="warn">notifications_active</mat-icon>
              <mat-card-title>Notification Settings</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="notificationForm" class="settings-form">
                <div class="toggle-item">
                  <div class="item-info">
                    <p class="item-label">WhatsApp Reminders</p>
                    <p class="item-sub">Auto-send rent due reminders via WhatsApp</p>
                  </div>
                  <mat-slide-toggle formControlName="whatsappReminders" color="primary"></mat-slide-toggle>
                </div>

                <div class="toggle-item">
                  <div class="item-info">
                    <p class="item-label">Email Notifications</p>
                    <p class="item-sub">Send email for payment confirmations</p>
                  </div>
                  <mat-slide-toggle formControlName="emailNotifications" color="primary"></mat-slide-toggle>
                </div>

                <div class="toggle-item">
                  <div class="item-info">
                    <p class="item-label">Overdue Alerts</p>
                    <p class="item-sub">Alert when payment is overdue</p>
                  </div>
                  <mat-slide-toggle formControlName="overdueAlerts" color="primary"></mat-slide-toggle>
                </div>

                <div class="toggle-item">
                  <div class="item-info">
                    <p class="item-label">Maintenance Alerts</p>
                    <p class="item-sub">Notify on new complaints</p>
                  </div>
                  <mat-slide-toggle formControlName="maintenanceAlerts" color="primary"></mat-slide-toggle>
                </div>

                <div class="toggle-item">
                  <div class="item-info">
                    <p class="item-label">Monthly Report Email</p>
                    <p class="item-sub">Auto-email report on 1st of month</p>
                  </div>
                  <mat-slide-toggle formControlName="monthlyReportEmail" color="primary"></mat-slide-toggle>
                </div>

                <div class="action-row" style="margin-top: 12px;">
                  <button mat-flat-button color="primary" [disabled]="loading" (click)="saveSettings()">
                    Save Notifications
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- USER MANAGEMENT -->
          <mat-card class="section-card" style="margin-top: 24px;">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">person</mat-icon>
              <mat-card-title>User Management</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="user-list">
                <div class="user-item">
                  <div class="user-avatar">S</div>
                  <div class="user-details">
                    <p class="user-email">{{currentUserEmail}}</p>
                    <p class="user-role">{{currentUserRole}}</p>
                  </div>
                  <span class="you-badge">YOU</span>
                </div>
                <button mat-stroked-button color="primary" class="add-staff-btn">
                  <mat-icon>add</mat-icon> Add Staff User
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page { max-width: 1200px; margin: 0 auto; padding: 24px; }

    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .section-card { border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
    
    .settings-form { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .row mat-form-field { flex: 1; }

    .setting-item, .toggle-item { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: 12px 0; border-bottom: 1px solid #f1f5f9;
    }
    .setting-item:last-child, .toggle-item:last-child { border-bottom: none; }
    
    .item-info { flex: 1; }
    .item-label { margin: 0; font-size: 14px; font-weight: 600; color: #1e293b; }
    .item-sub { margin: 2px 0 0; font-size: 12px; color: #64748b; }

    .action-row { display: flex; justify-content: flex-end; margin-top: 8px; }

    /* User Management */
    .user-list { margin-top: 16px; display: flex; flex-direction: column; gap: 16px; }
    .user-item { 
      display: flex; align-items: center; gap: 12px; 
      padding: 12px; background: #f8fafc; border-radius: 8px;
    }
    .user-avatar { 
      width: 36px; height: 36px; background: #3b82f6; color: white; 
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: 700;
    }
    .user-details { flex: 1; }
    .user-email { margin: 0; font-size: 14px; font-weight: 600; color: #1e293b; }
    .user-role { margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    .you-badge { 
      font-size: 10px; font-weight: 700; color: #10b981; background: #ecfdf5; 
      padding: 2px 8px; border-radius: 12px; border: 1px solid #d1fae5;
    }
    .add-staff-btn { width: 100%; margin-top: 8px; border-style: dashed; }

    @media (max-width: 900px) {
      .settings-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  profileForm: FormGroup;
  notificationForm: FormGroup;
  paymentForm: FormGroup;
  
  currentUserEmail = '';
  currentUserRole = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      pgName: ['', Validators.required],
      ownerName: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required]
    });

    this.notificationForm = this.fb.group({
      whatsappReminders: [true],
      emailNotifications: [true],
      overdueAlerts: [true],
      maintenanceAlerts: [false],
      monthlyReportEmail: [false]
    });

    this.paymentForm = this.fb.group({
      defaultRentDueDay: [1],
      lateFeeAfterDays: [5],
      lateFeeAmount: [50]
    });
  }

  ngOnInit(): void {
    this.currentUserEmail = this.auth.getCurrentUserEmail();
    this.currentUserRole = this.auth.getUserRole();
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.settingsService.getSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.profileForm.patchValue({
            pgName: settings.pgName,
            ownerName: settings.ownerName,
            phone: settings.phone,
            address: settings.address
          });
          this.notificationForm.patchValue({
            whatsappReminders: settings.whatsappReminders,
            emailNotifications: settings.emailNotifications,
            overdueAlerts: settings.overdueAlerts,
            maintenanceAlerts: settings.maintenanceAlerts,
            monthlyReportEmail: settings.monthlyReportEmail
          });
          this.paymentForm.patchValue({
            defaultRentDueDay: settings.defaultRentDueDay,
            lateFeeAfterDays: settings.lateFeeAfterDays,
            lateFeeAmount: settings.lateFeeAmount
          });
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load settings', err);
        this.loading = false;
        this.snackBar.open('Failed to load settings from server.', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  saveSettings(): void {
    this.loading = true;
    const combinedSettings: PgSettings = {
      ...this.profileForm.value,
      ...this.notificationForm.value,
      ...this.paymentForm.value
    };

    this.settingsService.updateSettings(combinedSettings).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Settings saved successfully!', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to save settings', err);
        this.loading = false;
        this.snackBar.open('Failed to save settings. Please try again.', 'Close', { duration: 5000 });
        this.cdr.detectChanges();
      }
    });
  }
}
