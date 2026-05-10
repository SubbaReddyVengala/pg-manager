import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TenantResponse, TenantDetailResponse,
  TenantRequest, TenantStats, PaginatedResponse
} from '../../shared/models/tenant.models';
import { RoomResponse } from '../../shared/models/room.models';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tenants`;
  private roomBase = `${environment.apiUrl}/rooms`;

  getAll(page: number = 0, size: number = 20, status?: string, search?: string, sort?: string): Observable<PaginatedResponse<TenantResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (status && status !== 'ALL') params = params.set('status', status);
    if (search) params = params.set('search', search);
    if (sort) params = params.set('sort', sort);

    return this.http.get<PaginatedResponse<TenantResponse>>(this.base, { params });
  }

  getStats(): Observable<TenantStats> {
    return this.http.get<TenantStats>(`${this.base}/stats`);
  }

  getById(id: number): Observable<TenantDetailResponse> {
    return this.http.get<TenantDetailResponse>(`${this.base}/${id}`);
  }

  getTenantsByRoom(roomId: number): Observable<TenantResponse[]> {
    return this.http.get<TenantResponse[]>(`${this.base}/room/${roomId}`);
  }

  createTenant(req: TenantRequest): Observable<TenantDetailResponse> {
    return this.http.post<TenantDetailResponse>(this.base, req);
  }

  updateTenant(id: number, req: TenantRequest): Observable<TenantDetailResponse> {
    return this.http.put<TenantDetailResponse>(`${this.base}/${id}`, req);
  }

  // Aliases for compatibility
  create(req: TenantRequest): Observable<TenantDetailResponse> { return this.createTenant(req); }
  update(id: number, req: TenantRequest): Observable<TenantDetailResponse> { return this.updateTenant(id, req); }

  assignRoom(tenantId: number, roomId: number): Observable<TenantDetailResponse> {
    return this.http.post<TenantDetailResponse>(
      `${this.base}/${tenantId}/assign-room`,
      { roomId: roomId }
    );
  }

  moveOut(tenantId: number): Observable<TenantDetailResponse> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.post<TenantDetailResponse>(
      `${this.base}/${tenantId}/move-out`,
      { moveOutDate: today }
    );
  }

  getAvailableRooms(): Observable<RoomResponse[]> {
    return this.http.get<RoomResponse[]>(`${this.roomBase}/available`);
  }

  deleteTenant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
