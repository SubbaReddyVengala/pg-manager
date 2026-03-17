import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TenantResponse, TenantDetailResponse,
  TenantRequest, TenantStats
} from '../../shared/models/tenant.models';
import { RoomResponse } from '../../shared/models/room.models';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tenants`;
  private roomBase = `${environment.apiUrl}/rooms`;

  // ── List & Stats ──────────────────────────────────────────────────────
  getAll(): Observable<TenantResponse[]> {
    return this.http.get<TenantResponse[]>(this.base);
  }

  getStats(): Observable<TenantStats> {
    return this.http.get<TenantStats>(`${this.base}/stats`);
  }

  // ── Single tenant ─────────────────────────────────────────────────────
  getById(id: number): Observable<TenantDetailResponse> {
    return this.http.get<TenantDetailResponse>(`${this.base}/${id}`);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────
  create(req: TenantRequest): Observable<TenantDetailResponse> {
    return this.http.post<TenantDetailResponse>(this.base, req);
  }

  update(id: number, req: TenantRequest): Observable<TenantDetailResponse> {
    return this.http.put<TenantDetailResponse>(`${this.base}/${id}`, req);
  }

  // ── Assign Room ───────────────────────────────────────────────────────
  assignRoom(tenantId: number, roomId: number): Observable<TenantDetailResponse> {
    const params = new HttpParams().set('roomId', roomId);
    return this.http.patch<TenantDetailResponse>(
      `${this.base}/${tenantId}/assign-room`, null, { params }
    );
  }

  // ── Move Out ──────────────────────────────────────────────────────────
 moveOut(tenantId: number): Observable<TenantDetailResponse> {
  const today = new Date().toISOString().split('T')[0];
  return this.http.post<TenantDetailResponse>(
    `${this.base}/${tenantId}/move-out`,
    { moveOutDate: today }
  );
}

  // ── Available rooms (for Assign Room dropdown) ───────────────────────
  getAvailableRooms(): Observable<RoomResponse[]> {
    const params = new HttpParams().set('status', 'AVAILABLE');
    return this.http.get<RoomResponse[]>(this.roomBase, { params });
  }
}

