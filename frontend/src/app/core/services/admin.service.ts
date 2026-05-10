import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterRequest, UserProfile, AuthResponse } from '../../shared/models/auth.models';

export interface OwnerProfileDTO {
  userId: number;
  email: string;
  phone?: string;
  fullName: string;
  status: string;
  trialEndDate?: string;
  maxRooms: number;
  maxTenants: number;
  dashboardEnabled: boolean;
  paymentsEnabled: boolean;
  reportsEnabled: boolean;
  whatsappEnabled: boolean;
  maintenanceEnabled: boolean;
  expensesEnabled: boolean;
  bulkOpsEnabled: boolean;
  pdfReceiptsEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
  roomCount: number;
  tenantCount: number;
  healthScore: number;
  tempPassword?: string;
}

export interface OwnerStatsResponse {
  roomsCount: number;
  tenantsCount: number;
  collectedThisMonth: number;
  openTicketsCount: number;
}

export interface UpdateOwnerStatusRequest {
  status: string;
  reason: string;
  notifyOwner: boolean;
}

export interface UserActivityDTO {
  actionType: string;
  description: string;
  timestamp: string;
}

export interface OnboardingChecklistDTO {
  provisioned: boolean;
  emailDelivered: boolean;
  firstLoginCompleted: boolean;
  passwordChanged: boolean;
  profileSetup: boolean;
  firstRoomAdded: boolean;
  firstTenantAdded: boolean;
}

export interface PlatformStatsResponse {
  totalOwners: number;
  activeOwners: number;
  totalTenants: number;
  totalRooms: number;
  totalRevenueThisMonth: number;
  pendingLimitRequests: number;
  openMaintenanceTickets: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private API = `${environment.apiUrl}/admin`;

  getPlatformStats(): Observable<PlatformStatsResponse> {
    return this.http.get<PlatformStatsResponse>(`${this.API}/stats`);
  }

  provisionOwner(request: RegisterRequest): Observable<OwnerProfileDTO> {
    return this.http.post<OwnerProfileDTO>(`${this.API}/provision`, request);
  }

  getAllOwners(): Observable<OwnerProfileDTO[]> {
    return this.http.get<OwnerProfileDTO[]>(`${this.API}/owners`);
  }

  getOwnerProfile(id: number): Observable<OwnerProfileDTO> {
    return this.http.get<OwnerProfileDTO>(`${this.API}/owners/${id}/profile`);
  }

  getOwnerStats(id: number): Observable<OwnerStatsResponse> {
    return this.http.get<OwnerStatsResponse>(`${this.API}/owners/${id}/stats`);
  }

  updateOwnerProfile(id: number, updates: OwnerProfileDTO): Observable<OwnerProfileDTO> {
    return this.http.put<OwnerProfileDTO>(`${this.API}/owners/${id}/profile`, updates);
  }

  updateOwnerStatus(id: number, request: UpdateOwnerStatusRequest): Observable<void> {
    return this.http.post<void>(`${this.API}/owners/${id}/status`, request);
  }

  impersonateOwner(id: number): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/owners/${id}/impersonate`, {});
  }

  forcePasswordReset(id: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.API}/owners/${id}/force-reset`, {}, { params: { reason } });
  }

  deleteOwnerPermanently(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/owners/${id}`);
  }

  sendMessage(id: number, message: string, mode: string): Observable<void> {
    return this.http.post<void>(`${this.API}/owners/${id}/message`, {}, { params: { message, mode } });
  }

  getOwnerTimeline(id: number): Observable<UserActivityDTO[]> {
    return this.http.get<UserActivityDTO[]>(`${this.API}/owners/${id}/timeline`);
  }

  getOnboardingChecklist(id: number): Observable<OnboardingChecklistDTO> {
    return this.http.get<OnboardingChecklistDTO>(`${this.API}/owners/${id}/onboarding-checklist`);
  }

  getPendingLimitRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/limit-requests`);
  }

  processLimitRequest(id: number, action: 'APPROVE' | 'REJECT', adminNote: string = ''): Observable<void> {
    return this.http.post<void>(`${this.API}/limit-requests/${id}/process`, {}, { 
      params: { action, adminNote } 
    });
  }
}
