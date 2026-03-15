import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../shared/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-card">

        <!-- Logo / Brand -->
        <div class="brand">
          <div class="brand-icon">
            <mat-icon>apartment</mat-icon>
          </div>
          <h1 class="brand-name">PG Manager</h1>
          <p class="brand-sub">Sign in to your account</p>
        </div>

        <!-- Error Alert -->
        <div class="error-alert" *ngIf="errorMessage">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email address</mat-label>
            <input matInput formControlName="email"
                   type="email" placeholder="you@example.com"
                   autocomplete="email">
            <mat-icon matPrefix>mail_outline</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">
              Email is required
            </mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">
              Please enter a valid email
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password"
                   [type]="showPassword ? 'text' : 'password'"
                   autocomplete="current-password">
            <mat-icon matPrefix>lock_outline</mat-icon>
            <button mat-icon-button matSuffix type="button"
                    (click)="showPassword = !showPassword">
              <mat-icon>{{ showPassword ? "visibility_off" : "visibility" }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">
              Password is required
            </mat-error>
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit"
                  class="submit-btn" [disabled]="form.invalid || loading">
            <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">Sign In</span>
          </button>

        </form>

        <!-- Footer Link -->
        <p class="auth-footer">
          New to PG Manager?
          <a routerLink="/auth/register">Create an account</a>
        </p>

      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1B3A6B 0%, #2471A3 100%);
      padding: 16px;
    }
    .auth-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .brand { text-align: center; margin-bottom: 32px; }
    .brand-icon {
      width: 64px; height: 64px;
      background: #1B3A6B;
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .brand-icon mat-icon { color: white; font-size: 32px; width: 32px; height: 32px; }
    .brand-name { font-size: 24px; font-weight: 700; color: #1B3A6B; margin: 0 0 4px; }
    .brand-sub  { font-size: 14px; color: #888; margin: 0; }
    .error-alert {
      display: flex; align-items: center; gap: 8px;
      background: #FDEDEC; border: 1px solid #E74C3C;
      border-radius: 8px; padding: 12px 16px;
      color: #C0392B; font-size: 14px; margin-bottom: 20px;
    }
    .auth-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .submit-btn {
      width: 100%; height: 48px; font-size: 16px;
      font-weight: 600; border-radius: 8px; margin-top: 8px;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: #666; }
    .auth-footer a { color: #2471A3; font-weight: 600; text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; }
    @media (max-width: 480px) {
      .auth-card { padding: 24px 20px; border-radius: 8px; }
      .brand-name { font-size: 20px; }
    }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading     = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb:   FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['',  Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';

    const request: LoginRequest = this.form.value;
    this.auth.login(request).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Login failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
