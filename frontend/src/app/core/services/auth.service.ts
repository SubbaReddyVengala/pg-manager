import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile, ChangePasswordRequest } from '../../shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = environment.apiUrl + '/auth';
  private readonly STORAGE_KEY = 'pg_auth';
  private readonly ADMIN_TOKEN_KEY = 'pg_admin_token';

  // BehaviorSubject: holds current user, emits to all subscribers
  private currentUser$ = new BehaviorSubject<AuthResponse | null>(this.loadFromStorage());

  constructor(private http: HttpClient, private router: Router) {}

  // ── Login ───────────────────────────────────────────────
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, request)
      .pipe(tap(response => this.saveToStorage(response)));
  }

  // ── Register ─────────────────────────────────────────────
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, request)
      .pipe(tap(response => {
        if (response.accessToken) {
          this.saveToStorage(response);
        }
      }));
  }

  // ── Logout ───────────────────────────────────────────────
  logout(): void {
    if (this.isImpersonating()) {
      this.stopImpersonating();
      return;
    }
    this.http.post(`${this.API}/logout`, {}).subscribe();
    this.clearStorage();
    this.router.navigate(['/auth/login']);
  }

  // ── Impersonation ────────────────────────────────────────
  setImpersonationToken(resp: AuthResponse): void {
    // Save current admin state if not already impersonating
    if (!this.isImpersonating()) {
      localStorage.setItem(this.ADMIN_TOKEN_KEY, JSON.stringify(this.currentUser$.value));
    }
    this.saveToStorage(resp);
  }

  isImpersonating(): boolean {
    return localStorage.getItem(this.ADMIN_TOKEN_KEY) !== null;
  }

  stopImpersonating(): void {
    const adminData = localStorage.getItem(this.ADMIN_TOKEN_KEY);
    if (adminData) {
      const adminAuth = JSON.parse(adminData);
      this.saveToStorage(adminAuth);
      localStorage.removeItem(this.ADMIN_TOKEN_KEY);
      this.router.navigate(['/admin']);
    }
  }

  // ── Get current user profile from backend ────────────────
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API}/me`);
  }

  // ── Staff Management ────────────────────────────────────
  getStaff(): Observable<UserProfile[]> {
    return this.http.get<UserProfile[]>(`${this.API}/staff`);
  }

  addStaff(request: RegisterRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.API}/staff`, request);
  }

  deleteStaff(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/staff/${id}`);
  }

  // ── Settings/Auth Management ─────────────────────────────
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.API}/change-password`, request);
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.API}/forgot-password`, {}, { params: { email } });
  }

  completeReset(request: any): Observable<void> {
    return this.http.post<void>(`${this.API}/reset-password`, request);
  }

  // ── Helpers ──────────────────────────────────────────────
  getToken(): string | null {
    return this.currentUser$.value?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this.currentUser$.value?.refreshToken ?? null;
  }

  refreshToken(): Observable<AuthResponse> {
    const token = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${this.API}/refresh`, {}, {
      params: { token: token ?? '' },
      withCredentials: true
    }).pipe(tap(response => this.saveToStorage(response)));
  }

  isLoggedIn(): boolean {
    return this.currentUser$.value !== null;
  }

  getCurrentUser(): Observable<AuthResponse | null> {
    return this.currentUser$.asObservable();
  }

  getUserName(): string {
    return this.currentUser$.value?.fullName ?? 'User';
  }

  getUserRole(): string {
    return this.currentUser$.value?.role ?? '';
  }

  isSuperAdmin(): boolean {
    return this.getUserRole() === 'SUPER_ADMIN';
  }

  isStaff(): boolean {
    return this.getUserRole() === 'STAFF';
  }

  isFirstLogin(): boolean {
    return this.currentUser$.value?.isFirstLogin ?? false;
  }

  getCurrentUserEmail(): string {
    return this.currentUser$.value?.email ?? '';
  }

  getRawUser(): AuthResponse | null {
    return this.currentUser$.value;
  }

  updateLocalUser(user: AuthResponse): void {
    this.saveToStorage(user);
  }

  handleOAuthToken(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const response: AuthResponse = {
        accessToken: token,
        refreshToken: payload.refreshToken || '',
        tokenType: 'Bearer',
        userId: payload.userId,
        email: payload.sub,
        fullName: payload.fullName || payload.sub,
        role: payload.role,
        ownerId: payload.ownerId,
        isFirstLogin: payload.isFirstLogin || false
      };
      this.saveToStorage(response);
    } catch (e) {
      console.error('Failed to decode OAuth token', e);
    }
  }

  // ── Private storage methods ──────────────────────────────
  private saveToStorage(response: AuthResponse): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(response));
    this.currentUser$.next(response);
  }

  private loadFromStorage(): AuthResponse | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ADMIN_TOKEN_KEY);
    this.currentUser$.next(null);
  }
}
