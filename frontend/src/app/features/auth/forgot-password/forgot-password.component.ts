import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card animate-in">
        <div class="header">
          <div class="icon-box"><mat-icon>lock_outline</mat-icon></div>
          <h1>Forgot Password?</h1>
          <p>Enter your email and we'll send you a link to reset your password.</p>
        </div>

        <div class="success-alert" *ngIf="submitted">
          <mat-icon>check_circle</mat-icon>
          <span>If your email is registered, you will receive a reset link shortly.</span>
        </div>

        <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()" class="form" *ngIf="!submitted">
          <div class="field">
            <label>Email Address</label>
            <input type="email" formControlName="email" placeholder="you@example.com">
            <div class="error-text" *ngIf="forgotForm.get('email')?.touched && forgotForm.get('email')?.invalid">
               Please enter a valid email.
            </div>
          </div>

          <button mat-flat-button color="primary" [disabled]="forgotForm.invalid || loading">
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>

          <div class="footer">
            <a routerLink="/auth/login">Back to Login</a>
          </div>
        </form>

        <div class="footer" *ngIf="submitted">
          <button mat-button color="primary" routerLink="/auth/login">Back to Login</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #1B3A6B 0%, #2471A3 100%); padding: 16px;
    }
    .auth-card {
      background: white; width: 100%; max-width: 420px; border-radius: 12px;
      padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .header { text-align: center; margin-bottom: 24px; }
    .icon-box {
      width: 64px; height: 64px; background: #eff6ff; color: #3b82f6;
      border-radius: 16px; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .icon-box mat-icon { font-size: 32px; width: 32px; height: 32px; }
    h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
    p { font-size: 14px; color: #64748b; margin-top: 8px; line-height: 1.5; }

    .form { display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    label { font-size: 13px; font-weight: 600; color: #1e293b; }
    input {
      padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 8px;
      outline: none; transition: 0.2s; background: #f8fafc;
    }
    input:focus { border-color: #3b82f6; background: white; }
    
    button { height: 48px; border-radius: 8px !important; font-weight: 600 !important; }
    .footer { text-align: center; margin-top: 16px; }
    .footer a { color: #3b82f6; font-size: 14px; font-weight: 600; text-decoration: none; }
    .error-text { color: #ef4444; font-size: 12px; margin-top: 4px; }
    
    .success-alert {
      display: flex; align-items: center; gap: 12px;
      background: #ecfdf5; border: 1px solid #10b981;
      padding: 16px; border-radius: 8px; color: #065f46;
      font-size: 14px; line-height: 1.4;
    }

    .animate-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  forgotForm: FormGroup;
  loading = false;
  submitted = false;

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;
    this.loading = true;

    this.auth.forgotPassword(this.forgotForm.value.email).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
      },
      error: () => {
        // We show success even if email not found for security (don't leak registered emails)
        this.loading = false;
        this.submitted = true;
      }
    });
  }
}
