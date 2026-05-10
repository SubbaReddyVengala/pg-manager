import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AdminService, OwnerProfileDTO, OwnerStatsResponse, UserActivityDTO, OnboardingChecklistDTO, PlatformStatsResponse } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { FilterByStatusPipe } from '../../shared/pipes/filter-by-status.pipe';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSnackBarModule, MatIconModule, MatDividerModule
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  public cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  activeTab = 0;
  owners: OwnerProfileDTO[] = [];
  selectedOwner?: OwnerProfileDTO;
  selectedOwnerStats?: OwnerStatsResponse;
  platformStats?: PlatformStatsResponse;
  selectedOwnerTimeline: UserActivityDTO[] = [];
  selectedOwnerChecklist?: OnboardingChecklistDTO;
  pendingRequests: any[] = [];
  
  loading = false;
  
  // Provisioning Wizard
  provisionStep = 1;
  ownerForm: FormGroup; // Step 1
  limitsForm: FormGroup; // Step 2
  permsForm: FormGroup; // Step 3
  lastGeneratedPassword = '';

  // Other forms
  messageForm: FormGroup;
  statusForm: FormGroup;

  constructor() {
    this.ownerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern('^[a-zA-Z ]*$')]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      pgName: ['', Validators.maxLength(100)],
      city: ['', Validators.maxLength(50)]
    });

    this.limitsForm = this.fb.group({
      accountType: ['Active'],
      trialDuration: ['14 days'],
      maxRooms: [50, [Validators.required, Validators.min(1), Validators.max(1000)]],
      maxTenants: [200, [Validators.required, Validators.min(1), Validators.max(5000)]]
    });

    this.permsForm = this.fb.group({
      dashboardEnabled: [true],
      paymentsEnabled: [true],
      reportsEnabled: [true],
      maintenanceEnabled: [true],
      expensesEnabled: [false],
      bulkOpsEnabled: [false],
      pdfReceiptsEnabled: [true]
    });

    this.messageForm = this.fb.group({
      target: ['selected'],
      message: ['', Validators.required],
      mode: ['Email']
    });

    this.statusForm = this.fb.group({
      reason: ['', Validators.required],
      notify: [true]
    });
  }

  ngOnInit(): void {
    this.loadOwners();
    this.loadPlatformStats();
  }

  loadPlatformStats(): void {
    this.adminService.getPlatformStats().subscribe({
      next: (data) => {
        this.platformStats = data;
      },
      error: () => {}
    });
  }

  loadOwners(): void {
    this.loading = true;
    this.adminService.getAllOwners().subscribe({
      next: (data) => {
        this.owners = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
    this.loadPendingRequests();
  }

  loadPendingRequests(): void {
    this.adminService.getPendingLimitRequests().subscribe(data => {
      this.pendingRequests = data;
    });
  }

  onProcessRequest(requestId: number, action: 'APPROVE' | 'REJECT'): void {
    const note = prompt(`Enter ${action.toLowerCase()} note (optional):`) || '';
    this.adminService.processLimitRequest(requestId, action, note).subscribe({
      next: () => {
        this.snackBar.open(`Request ${action.toLowerCase()}d`, 'OK');
        this.loadOwners(); // Reload stats and requests
        this.loadPlatformStats();
      }
    });
  }

  switchTab(i: number): void {
    this.activeTab = i;
    if (i === 0) {
      this.loadOwners();
      this.loadPlatformStats();
    }
  }

  onOwnerSelect(event: any): void {
    const userId = +event.target.value;
    if (userId) {
      const owner = this.owners.find(o => o.userId === userId);
      if (owner) this.viewProfile(owner);
    }
  }

  viewProfile(owner: OwnerProfileDTO): void {
    this.selectedOwner = owner;
    this.activeTab = 2; // Profile Tab
    this.loadOwnerDetails(owner.userId);
  }

  loadOwnerDetails(userId: number): void {
    this.adminService.getOwnerStats(userId).subscribe(s => this.selectedOwnerStats = s);
    this.adminService.getOwnerTimeline(userId).subscribe(t => this.selectedOwnerTimeline = t);
    this.adminService.getOnboardingChecklist(userId).subscribe(c => this.selectedOwnerChecklist = c);
  }

  // ── Provisioning Wizard ─────────────────────────────
  nextStep() { if (this.provisionStep < 4) this.provisionStep++; }
  prevStep() { if (this.provisionStep > 1) this.provisionStep--; }

  onProvision(): void {
    if (this.ownerForm.invalid) return;
    this.loading = true;
    
    const email = this.ownerForm.value.email;
    const existing = this.owners.find(o => o.email.toLowerCase() === email.toLowerCase());
    const isActivation = existing && (existing.status === 'PENDING' || existing.status === 'INACTIVE');

    const tempPass = isActivation ? '' : this.generateComplexPassword();
    const request = { 
      ...this.ownerForm.value, 
      password: tempPass || 'PRESERVE_EXISTING',
      // Add profile info from limits & perms
      ...this.limitsForm.value,
      ...this.permsForm.value
    };

    this.adminService.provisionOwner(request).subscribe({
      next: () => {
        this.loading = false;
        this.lastGeneratedPassword = tempPass;
        const msg = isActivation ? 'Account activated!' : 'PG Owner provisioned successfully!';
        this.snackBar.open(msg, 'OK', { duration: 3000 });
        this.provisionStep = 4; // Stay on confirm step to show password
        this.loadOwners();
        this.loadPlatformStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Provisioning failed', 'Close');
      }
    });
  }

  resetProvisioning() {
    this.provisionStep = 1;
    this.ownerForm.reset({
      fullName: '', email: '', phone: '', pgName: '', city: ''
    });
    this.lastGeneratedPassword = '';
  }

  // ── Support Actions ─────────────────────────────────
  impersonate(): void {
    if (!this.selectedOwner) return;
    this.adminService.impersonateOwner(this.selectedOwner.userId).subscribe({
      next: (resp) => {
        this.authService.setImpersonationToken(resp);
        this.snackBar.open(`Impersonating ${this.selectedOwner?.fullName}`, 'OK', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onSendMessage() {
    if (!this.selectedOwner || this.messageForm.invalid) return;
    const { message, mode } = this.messageForm.value;
    this.adminService.sendMessage(this.selectedOwner.userId, message, mode).subscribe(() => {
      this.snackBar.open('Message sent successfully', 'OK');
      this.messageForm.reset({ target: 'selected', mode: 'Email' });
      this.loadOwnerDetails(this.selectedOwner!.userId);
    });
  }

  forceReset(): void {
    if (!this.selectedOwner) return;
    if (confirm('Force password reset? The owner will be logged out.')) {
      this.adminService.forcePasswordReset(this.selectedOwner.userId, 'Admin reset').subscribe({
        next: () => {
          this.snackBar.open('Reset triggered', 'OK');
          this.loadOwnerDetails(this.selectedOwner!.userId);
        }
      });
    }
  }

  updateStatus(status: string): void {
    if (!this.selectedOwner) return;
    const request = { status, reason: 'Lifecycle update', notifyOwner: true };
    this.adminService.updateOwnerStatus(this.selectedOwner.userId, request).subscribe({
      next: () => {
        this.snackBar.open(`Status updated to ${status}`, 'OK');
        this.selectedOwner!.status = status;
        this.loadOwners();
        this.loadPlatformStats();
        this.cdr.detectChanges();
      }
    });
  }

  deletePermanently(): void {
    if (!this.selectedOwner) return;
    if (prompt('Type CONFIRM to delete everything:') === 'CONFIRM') {
      this.adminService.deleteOwnerPermanently(this.selectedOwner.userId).subscribe(() => {
        this.snackBar.open('Deleted permanently', 'OK');
        this.selectedOwner = undefined;
        this.switchTab(0);
        this.loadPlatformStats();
      });
    }
  }

  private generateComplexPassword(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let pass = "";
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  }

  copyPassword(pass: string): void {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    this.snackBar.open('Copied to clipboard', 'OK', { duration: 2000 });
  }

  getHealthColor(score: number): string {
    if (score > 80) return '#22C574';
    if (score > 40) return '#F5A623';
    return '#F04747';
  }
}
