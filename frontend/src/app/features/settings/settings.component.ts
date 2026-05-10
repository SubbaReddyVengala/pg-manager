import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
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
import { AdminService, OwnerProfileDTO } from '../../core/services/admin.service';
import { RoomService } from '../../core/services/room.service';
import { TenantService } from '../tenants/tenant.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfile } from '../../shared/models/auth.models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule, MatSnackBarModule, 
    MatIconModule, MatSlideToggleModule, MatDividerModule
  ],
  template: `
    <div class="settings-page animate-in">
      <div class="settings-grid">
        <!-- LEFT COLUMN -->
        <div class="column">
          <!-- PG PROFILE -->
          <mat-card class="section-card glass">
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
          <mat-card class="section-card glass" style="margin-top: 24px;">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">payments</mat-icon>
              <mat-card-title>Payment Settings</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="paymentForm" class="settings-form">
                <div class="setting-item">
                  <div class="item-info">
                    <p class="item-label">Default Rent Due Day</p>
                    <p class="item-sub">Fixed day for recurring invoices</p>
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
                    <p class="item-label">UPI ID for Deep Links</p>
                    <p class="item-sub">Used for payment collection alerts</p>
                  </div>
                  <mat-form-field appearance="outline" style="width: 200px;">
                    <input matInput formControlName="upiId" placeholder="username@bank">
                  </mat-form-field>
                </div>

                <div class="action-row">
                  <button mat-flat-button color="primary" [disabled]="loading || paymentForm.invalid" (click)="saveSettings()">
                    Save Rules
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="column">
          <!-- NOTIFICATION SETTINGS -->
          <mat-card class="section-card glass">
            <mat-card-header>
              <mat-icon mat-card-avatar color="warn">notifications_active</mat-icon>
              <mat-card-title>Notification Settings</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="notificationForm" class="settings-form">
                <div class="toggle-item">
                  <div class="item-info">
                    <p class="item-label">Email Notifications</p>
                    <p class="item-sub">Payment confirmation emails</p>
                  </div>
                  <mat-slide-toggle formControlName="emailNotifications" color="primary"></mat-slide-toggle>
                </div>

                <div class="action-row" style="margin-top: 12px;">
                  <button mat-flat-button color="primary" [disabled]="loading" (click)="saveSettings()">
                    Save Alerts
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- USER MANAGEMENT -->
          <mat-card class="section-card glass" style="margin-top: 24px;">
            <mat-card-header>
              <mat-icon mat-card-avatar color="primary">manage_accounts</mat-icon>
              <mat-card-title>User Management</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="user-list">
                <!-- LOGGED IN USER -->
                <div class="user-item current">
                  <div class="user-avatar">{{ currentUserEmail.charAt(0).toUpperCase() }}</div>
                  <div class="user-details">
                    <p class="user-email">{{currentUserEmail}}</p>
                    <p class="user-role">{{currentUserRole}}</p>
                  </div>
                  <span class="you-badge">YOU</span>
                </div>

                <!-- STAFF LIST -->
                <div class="user-item" *ngFor="let s of staffList">
                  <div class="user-avatar staff">{{ s.email.charAt(0).toUpperCase() }}</div>
                  <div class="user-details">
                    <p class="user-email">{{ s.email }}</p>
                    <p class="user-role">{{ s.role }}</p>
                  </div>
                  <button mat-icon-button color="warn" (click)="deleteStaff(s.userId)" title="Delete Staff">
                     <mat-icon>delete_outline</mat-icon>
                  </button>
                </div>

                <button mat-flat-button color="primary" class="add-staff-btn" (click)="showStaffModal = true">
                  <mat-icon>person_add</mat-icon> Add Staff User
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- PLAN & LIMITS -->
          <mat-card class="section-card glass" style="margin-top: 24px;">
            <mat-card-header>
              <mat-icon mat-card-avatar color="accent">stars</mat-icon>
              <mat-card-title>Plan & Limits</mat-card-title>
            </mat-card-header>
            <mat-card-content>
               <div class="limit-status" *ngIf="ownerProfile">
                  <div class="limit-item">
                    <label>ROOM LIMIT</label>
                    <div class="limit-val"><strong>{{ currentRooms }}</strong> / {{ ownerProfile.maxRooms }}</div>
                  </div>
                  <div class="limit-item">
                    <label>TENANT LIMIT</label>
                    <div class="limit-val"><strong>{{ activeTenants }}</strong> / {{ ownerProfile.maxTenants }}</div>
                  </div>
               </div>
               <button mat-stroked-button color="accent" class="upgrade-btn" (click)="showUpgradeModal = true">
                 <mat-icon>trending_up</mat-icon> Request Limit Increase
               </button>
            </mat-card-content>
          </mat-card>

          <!-- SECURITY -->
          <mat-card class="section-card glass" style="margin-top: 24px;">
            <mat-card-header>
              <mat-icon mat-card-avatar color="warn">lock</mat-icon>
              <mat-card-title>Security & Password</mat-card-title>
            </mat-card-header>
            <mat-card-content>
               <form [formGroup]="passwordForm" class="settings-form">
                 <mat-form-field appearance="outline" class="full-width">
                   <mat-label>Current Password</mat-label>
                   <input matInput type="password" formControlName="currentPassword">
                 </mat-form-field>
                 
                 <mat-form-field appearance="outline" class="full-width">
                   <mat-label>New Password</mat-label>
                   <input matInput type="password" formControlName="newPassword">
                   <mat-hint>Minimum 8 characters</mat-hint>
                 </mat-form-field>

                 <div class="action-row">
                   <button mat-flat-button color="warn" [disabled]="loadingPassword || passwordForm.invalid" (click)="changePassword()">
                     {{ loadingPassword ? 'Updating...' : 'Change Password' }}
                   </button>
                 </div>
               </form>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- UPGRADE MODAL -->
      <div class="modal-overlay" *ngIf="showUpgradeModal" (click)="showUpgradeModal = false">
        <div class="modal glass" (click)="$event.stopPropagation()">
           <div class="modal-header">
             <h2>Request Upgrade</h2>
             <button class="close-x" (click)="showUpgradeModal = false"><mat-icon>close</mat-icon></button>
           </div>
           
           <form [formGroup]="upgradeForm" (ngSubmit)="submitUpgradeRequest()" class="staff-form">
              <p class="modal-hint">Submit a request to the Super Admin to increase your PG capacity.</p>
              
              <div class="field">
                <label>Increase for *</label>
                <select formControlName="requestType" class="custom-input">
                  <option value="ROOMS">Room Limit</option>
                  <option value="TENANTS">Tenant Limit</option>
                </select>
              </div>

              <div class="field">
                <label>Requested New Limit *</label>
                <input matInput type="number" formControlName="requestedLimit" class="custom-input">
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" (click)="showUpgradeModal = false">Cancel</button>
                <button type="submit" class="btn-submit" [disabled]="upgradeForm.invalid || submittingUpgrade">
                   {{ submittingUpgrade ? 'Submitting...' : 'Send Request' }}
                </button>
              </div>
           </form>
        </div>
      </div>

      <!-- ADD STAFF MODAL -->
      <div class="modal-overlay" *ngIf="showStaffModal" (click)="showStaffModal = false">
        <div class="modal glass" (click)="$event.stopPropagation()">
           <div class="modal-header">
             <h2>Create Staff Account</h2>
             <button class="close-x" (click)="showStaffModal = false"><mat-icon>close</mat-icon></button>
           </div>
           
           <form [formGroup]="staffForm" (ngSubmit)="addStaff()" class="staff-form">
              <p class="modal-hint">Staff members will have access to manage rooms and payments but cannot delete accounts.</p>
              
              <div class="field">
                <label>Full Name *</label>
                <input matInput formControlName="fullName" placeholder="e.g. John Doe" class="custom-input">
              </div>

              <div class="field">
                <label>Email Address *</label>
                <input matInput type="email" formControlName="email" placeholder="john@example.com" class="custom-input">
              </div>

              <div class="field">
                <label>Login Password *</label>
                <input matInput type="password" formControlName="password" placeholder="Min 8 characters" class="custom-input">
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" (click)="showStaffModal = false">Cancel</button>
                <button type="submit" class="btn-submit" [disabled]="staffForm.invalid || addingStaff">
                   {{ addingStaff ? 'Creating...' : 'Create Account' }}
                </button>
              </div>
           </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-page { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .glass { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.5) !important; }

    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .section-card { border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    
    .settings-form { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
    .full-width { width: 100%; }
    .row { display: flex; gap: 16px; }
    .row mat-form-field { flex: 1; }

    .setting-item, .toggle-item { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: 16px 0; border-bottom: 1px solid #f1f5f9;
    }
    .setting-item:last-child, .toggle-item:last-child { border-bottom: none; }
    
    .item-info { flex: 1; }
    .item-label { margin: 0; font-size: 14px; font-weight: 700; color: #1e293b; }
    .item-sub { margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 500; }

    .action-row { display: flex; justify-content: flex-end; margin-top: 12px; }

    /* User Management */
    .user-list { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
    .user-item { 
      display: flex; align-items: center; gap: 12px; 
      padding: 16px; background: white; border-radius: 12px; border: 1px solid #f1f5f9;
    }
    .user-avatar { 
      width: 40px; height: 40px; background: #3b82f6; color: white; 
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      font-weight: 800;
    }
    .user-avatar.staff { background: #64748b; }
    .user-details { flex: 1; }
    .user-email { margin: 0; font-size: 13px; font-weight: 700; color: #1e293b; }
    .user-role { margin: 0; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.5px; }
    .you-badge { 
      font-size: 9px; font-weight: 800; color: #10b981; background: #ecfdf5; 
      padding: 3px 8px; border-radius: 20px; border: 1px solid #d1fae5;
    }
    .add-staff-btn { width: 100%; height: 48px; border-radius: 12px !important; font-weight: 700 !important; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
    .modal { background: #fff; border-radius: 24px; padding: 32px; width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .modal-header h2 { margin: 0; font-size: 20px; font-weight: 900; color: #1e293b; }
    .close-x { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
    .modal-hint { font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 24px; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #f1f5f9; }
    .staff-form { display: flex; flex-direction: column; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 12px; font-weight: 700; color: #1e293b; }
    .custom-input { border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; font-size: 14px; background: #f8fafc; transition: 0.2s; outline: none; }
    .custom-input:focus { border-color: #3b82f6; background: white; }
    .modal-actions { display: flex; gap: 12px; margin-top: 24px; }
    .btn-cancel { flex: 1; border: 1px solid #e2e8f0; background: white; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-submit { flex: 1.5; border: none; background: #1e293b; color: white; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-submit:hover { background: #0f172a; }

    @media (max-width: 900px) {
      .settings-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  profileForm: FormGroup;
  notificationForm: FormGroup;
  paymentForm: FormGroup;
  staffForm: FormGroup;
  passwordForm: FormGroup;
  upgradeForm: FormGroup;
  
  staffList: UserProfile[] = [];
  currentUserEmail = '';
  currentUserRole = '';
  
  ownerProfile?: OwnerProfileDTO;
  currentRooms = 0;
  activeTenants = 0;

  loading = false;
  loadingPassword = false;
  showStaffModal = false;
  addingStaff = false;
  showUpgradeModal = false;
  submittingUpgrade = false;

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private adminService: AdminService,
    private roomService: RoomService,
    private tenantService: TenantService,
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
      emailNotifications: [true],
      overdueAlerts: [true],
      maintenanceAlerts: [false],
      monthlyReportEmail: [false]
    });

    this.paymentForm = this.fb.group({
      defaultRentDueDay: [1],
      lateFeeAfterDays: [5],
      lateFeeAmount: [50],
      upiId: ['']
    });

    this.staffForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.upgradeForm = this.fb.group({
      requestType: ['ROOMS', Validators.required],
      requestedLimit: [100, [Validators.required, Validators.min(1)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    this.currentUserEmail = this.auth.getCurrentUserEmail();
    this.currentUserRole = this.auth.getUserRole();
    this.loadSettings();
    this.loadStaff();
    this.loadPlanLimits();
  }

  loadPlanLimits(): void {
    const user = this.auth.getRawUser();
    if (!user) return;

    forkJoin({
      profile: this.adminService.getOwnerProfile(user.userId),
      stats: this.adminService.getOwnerStats(user.userId)
    }).subscribe(res => {
      this.ownerProfile = res.profile;
      this.currentRooms = res.stats.roomsCount;
      this.activeTenants = res.stats.tenantsCount;
      this.cdr.detectChanges();
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.loadingPassword = true;
    this.auth.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.loadingPassword = false;
        this.passwordForm.reset();
        this.snackBar.open('Password changed successfully!', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingPassword = false;
        this.snackBar.open(err.error?.message || 'Failed to change password', 'Close');
        this.cdr.detectChanges();
      }
    });
  }

  submitUpgradeRequest(): void {
    if (this.upgradeForm.invalid) return;
    this.submittingUpgrade = true;
    this.settingsService.submitLimitRequest(this.upgradeForm.value).subscribe({
      next: () => {
        this.submittingUpgrade = false;
        this.showUpgradeModal = false;
        this.snackBar.open('Upgrade request sent to Super Admin!', 'OK', { duration: 5000 });
      },
      error: (err) => {
        this.submittingUpgrade = false;
        this.snackBar.open(err.error?.message || 'Failed to send request', 'Close');
      }
    });
  }

  loadStaff(): void {
    this.auth.getStaff().subscribe({
      next: (list) => {
        this.staffList = list;
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Failed to load staff list.', 'Close')
    });
  }

  addStaff(): void {
    if (this.staffForm.invalid) return;
    this.addingStaff = true;
    this.auth.addStaff(this.staffForm.value).subscribe({
      next: () => {
        this.addingStaff = false;
        this.showStaffModal = false;
        this.staffForm.reset();
        this.loadStaff();
        this.snackBar.open('Staff account created successfully!', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.addingStaff = false;
        const msg = err.error?.message || 'Failed to create staff account';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  deleteStaff(id: number): void {
    if (confirm('Are you sure you want to remove this staff member? They will lose access immediately.')) {
      this.auth.deleteStaff(id).subscribe({
        next: () => {
          this.loadStaff();
          this.snackBar.open('Staff member removed.', 'OK');
        },
        error: () => this.snackBar.open('Failed to remove staff.', 'Close')
      });
    }
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
            emailNotifications: settings.emailNotifications,
            overdueAlerts: settings.overdueAlerts,
            maintenanceAlerts: settings.maintenanceAlerts,
            monthlyReportEmail: settings.monthlyReportEmail
          });
          this.paymentForm.patchValue({
            defaultRentDueDay: settings.defaultRentDueDay,
            lateFeeAfterDays: settings.lateFeeAfterDays,
            lateFeeAmount: settings.lateFeeAmount,
            upiId: settings.upiId
          });
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open('Failed to load settings.', 'Close');
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
        this.loading = false;
        this.snackBar.open('Failed to save settings.', 'Close');
        this.cdr.detectChanges();
      }
    });
  }
}
