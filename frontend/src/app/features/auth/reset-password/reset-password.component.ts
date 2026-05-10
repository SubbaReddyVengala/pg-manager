import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="reset-page">
      <div class="reset-card animate-in">
        <div class="header">
          <div class="icon-box"><mat-icon>lock_reset</mat-icon></div>
          <h1>Update Password</h1>
          <p *ngIf="!resetToken">For your security, please set a new permanent password to continue.</p>
          <p *ngIf="resetToken">Create a new secure password for your account.</p>
        </div>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="form">
          <div class="field" *ngIf="!resetToken">
            <label>Current Temporary Password</label>
            <input type="password" formControlName="currentPassword" placeholder="Enter temp password">
          </div>

          <div class="field">
            <label>New Permanent Password</label>
            <input type="password" formControlName="newPassword" placeholder="Min 8 chars, 1 Uppercase, 1 Digit, 1 Special">
            <div class="hint">Must contain: A-Z, a-z, 0-9, and a special character (e.g., @$!%*?&)</div>
          </div>

          <div class="field">
            <label>Confirm New Password</label>
            <input type="password" formControlName="confirmPassword" placeholder="Repeat new password">
          </div>

          <div class="error" *ngIf="resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched">
            Passwords do not match.
          </div>

          <button mat-flat-button color="primary" [disabled]="resetForm.invalid || loading">
            {{ loading ? 'Updating...' : (resetToken ? 'Reset Password' : 'Update & Enter Dashboard') }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .reset-page {
      height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #f8fafc; padding: 20px;
    }
    .reset-card {
      background: white; width: 100%; max-width: 440px; border-radius: 24px;
      padding: 40px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    .header { text-align: center; margin-bottom: 32px; }
    .icon-box {
      width: 56px; height: 56px; background: #eff6ff; color: #3b82f6;
      border-radius: 16px; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
    p { font-size: 14px; color: #64748b; margin-top: 8px; line-height: 1.5; }

    .form { display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 8px; }
    label { font-size: 12px; font-weight: 700; color: #1e293b; }
    .hint { font-size: 11px; color: #64748b; line-height: 1.4; }
    input {
      padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px;
      outline: none; transition: 0.2s; background: #f8fafc;
    }
    input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }
    
    button { height: 52px; border-radius: 12px !important; font-weight: 700 !important; margin-top: 10px; }
    .error { color: #ef4444; font-size: 12px; font-weight: 600; text-align: center; }
    
    .animate-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resetForm: FormGroup;
  loading = false;
  resetToken: string | null = null;

  constructor() {
    this.resetForm = this.fb.group({
      currentPassword: [''],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.resetToken = this.route.snapshot.queryParamMap.get('token');
    if (!this.resetToken) {
      this.resetForm.get('currentPassword')?.setValidators([Validators.required]);
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : {'mismatch': true};
  }

  onSubmit() {
    if (this.resetForm.invalid) return;
    this.loading = true;

    if (this.resetToken) {
      this.auth.completeReset({ token: this.resetToken, newPassword: this.resetForm.value.newPassword }).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Password reset successful! You can now log in.', 'OK', { duration: 5000 });
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err.error?.message || 'Reset failed. Token might be invalid or expired.', 'Close');
        }
      });
    } else {
      this.auth.changePassword(this.resetForm.value).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Password set successfully! Access granted.', 'OK', { duration: 3000 });
          
          // Update user state locally to clear first login flag
          const user = this.auth.getRawUser();
          if (user) {
            user.isFirstLogin = false;
            this.auth.updateLocalUser(user);
          }
          
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading = false;
          this.snackBar.open(err.error?.message || 'Update failed', 'Close');
        }
      });
    }
  }
}
