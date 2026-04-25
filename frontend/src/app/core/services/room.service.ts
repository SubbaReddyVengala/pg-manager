import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoomResponse, RoomRequest, RoomStats } from '../../shared/models/room.models';
import { PaginatedResponse } from '../../shared/models/tenant.models';

@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly API = environment.apiUrl + '/rooms';
  private refreshSubject = new Subject<void>();
  readonly refresh$ = this.refreshSubject.asObservable();

  constructor(private http: HttpClient) {}

  triggerRefresh(): void { this.refreshSubject.next(); }

  getRooms(status: string | null = null, search: string = '', page: number = 0, size: number = 20): Observable<PaginatedResponse<RoomResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    
    if (status && status !== 'ALL') params = params.set("status", status);
    if (search && search.trim()) params = params.set("search", search.trim());
    
    return this.http.get<PaginatedResponse<RoomResponse>>(this.API, { params });
  }

  getStats(): Observable<RoomStats> {
    return this.http.get<RoomStats>(`${this.API}/stats`);
  }

  addRoom(request: RoomRequest): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(this.API, request);
  }

  updateRoom(id: number, request: RoomRequest): Observable<RoomResponse> {
    return this.http.put<RoomResponse>(`${this.API}/${id}`, request);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  // Aliases for compatibility
  create(request: RoomRequest): Observable<RoomResponse> { return this.addRoom(request); }
  update(id: number, request: RoomRequest): Observable<RoomResponse> { return this.updateRoom(id, request); }
  getAll(status: string | null, search: string): Observable<PaginatedResponse<RoomResponse>> { return this.getRooms(status, search); }
}
