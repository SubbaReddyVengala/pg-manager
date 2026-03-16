import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RoomResponse, RoomRequest, RoomStats } from '../../shared/models/room.models';
import { Subject } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class RoomService {
  private readonly API = environment.apiUrl + '/rooms';
  constructor(private http: HttpClient) {}
private refreshSubject = new Subject<void>();
readonly refresh$ = this.refreshSubject.asObservable();
triggerRefresh(): void { this.refreshSubject.next(); }
  // Used by filter tabs (status=AVAILABLE) and search box (search=101)
  getAll(status: string | null, search: string): Observable<RoomResponse[]> {
    let params = new HttpParams();
    if (status) params = params.set("status", status);
    if (search && search.trim()) params = params.set("search", search.trim());
    return this.http.get<RoomResponse[]>(this.API, { params });
  }

  // Used by dashboard home stats cards
  getStats(): Observable<RoomStats> {
    return this.http.get<RoomStats>(`${this.API}/stats`);
  }

  create(request: RoomRequest): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(this.API, request);
  }

  update(id: number, request: RoomRequest): Observable<RoomResponse> {
    return this.http.put<RoomResponse>(`${this.API}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
