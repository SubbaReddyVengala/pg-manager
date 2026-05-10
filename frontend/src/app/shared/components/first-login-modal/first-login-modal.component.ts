import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-first-login-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-content animate-in">
        <div class="modal-header">
          <div class="header-icon"><mat-icon>security</mat-icon></div>
          <div class="header-text">
            <h2>Secure Your Account</h2>
            <p>This is your first login. Please set a new permanent password to continue.</p>
          </div>
        </div>

        <div class="modal-body">
          <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="reset-form">
            <div class="field">
              <label>Current Temporary Password</label>
              <input type="password" formControlName="currentPassword" class="custom-input" placeholder="Enter the temporary password">
            </div>

            <div class="field">
              <label>New Password</label>
              <input type="password" formControlName="newPassword" class="custom-input" placeholder="Min 8 characters">
            </div>

            <div class="field">
              <label>Confirm New Password</label>
              <input type="password" formControlName="confirmPassword" class="custom-input" placeholder="Repeat new password">
            </div>

            <div class="error-msg" *ngIf="resetForm.errors?.['mismatch'] && resetForm.get('confirmPassword')?.touched">
               Passwords do not match.
            </div>
            
            <button mat-flat-button color="primary" [disabled]="resetForm.invalid || loading" class="submit-btn">
              {{ loading ? 'Updating...' : 'Update & Continue' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(8px); z-index: 9999;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-content {
      background: white; width: 100%; max-width: 440px;
      border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .modal-header {
      padding: 32px 32px 24px; text-align: center;
    }
    .header-icon {
      width: 64px; height: 64px; background: #eff6ff; color: #3b82f6;
      border-radius: 20px; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    .header-icon mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .header-text h2 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
    .header-text p { margin: 8px 0 0; font-size: 14px; color: #64748b; line-height: 1.5; }

    .modal-body { padding: 0 32px 32px; }
    .reset-form { display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 8px; }
    .field label { font-size: 12px; font-weight: 700; color: #1e293b; }
    .custom-input { 
      border: 1.5px solid #e2e8f0; padding: 12px 16px; border-radius: 12px; 
      font-size: 14px; background: #f8fafc; outline: none; transition: 0.2s; 
    }
    .custom-input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    .submit-btn { height: 52px; border-radius: 14px !important; font-weight: 700 !important; font-size: 15px !important; margin-top: 10px; }
    .error-msg { color: #ef4444; font-size: 12px; font-weight: 600; text-align: center; }

    .animate-in { animation: modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `]
})
export class FirstLoginModalComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  @Output() completed = new EventEmitter<void>();
  
  resetForm: FormGroup;
  loading = false;

  constructor() {
    this.resetForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const newPass = g.get('newPassword')?.value;
    const confPass = g.get('confirmPassword')?.value;
    return newPass === confPass ? null : {'mismatch': true};
  }

  onSubmit() {
    if (this.resetForm.invalid) return;
    this.loading = true;

    const { currentPassword, newPassword } = this.resetForm.value;
    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Password updated successfully! Welcome.', 'OK', { duration: 3000 });
        this.completed.emit();
      },
      error: (err: any) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Failed to update password', 'Close', { duration: 5000 });
      }
    });
  }
}
