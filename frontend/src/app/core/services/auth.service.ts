	
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../../shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API = environment.apiUrl + '/auth';
  private readonly STORAGE_KEY = 'pg_auth';

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
      .pipe(tap(response => this.saveToStorage(response)));
  }

  // ── Logout ───────────────────────────────────────────────
  logout(): void {
    this.http.post(`${this.API}/logout`, {}).subscribe();
    this.clearStorage();
    this.router.navigate(['/auth/login']);
  }

  // ── Get current user profile from backend ────────────────
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API}/me`);
  }

  // ── Helpers ──────────────────────────────────────────────
  getToken(): string | null {
    return this.currentUser$.value?.accessToken ?? null;
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
    this.currentUser$.next(null);
  }
}

