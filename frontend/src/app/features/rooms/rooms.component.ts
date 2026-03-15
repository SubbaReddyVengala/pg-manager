import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoomResponse } from '../../shared/models/room.models';
import { RoomService } from '../../core/services/room.service';
import { RoomFormComponent } from './room-form.component';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule, RoomFormComponent],
  template: `
    <div class="page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2>Room Management</h2>
          <p>Manage all rooms in your PG</p>
        </div>
        <button mat-raised-button color="primary" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Room
        </button>
      </div>
      <!-- Card: Search + Filters + Table -->
      <div class="card">
        <!-- Toolbar -->
        <div class="toolbar">
          <div class="search-box">
            <mat-icon>search</mat-icon>
            <input [(ngModel)]="searchTerm" (ngModelChange)="onSearch()"
                   placeholder="Search room number...">
          </div>
          <div class="filter-tabs">
            <button *ngFor="let tab of filterTabs"
                    [class.active]="activeFilter === tab.value"
                    (click)="setFilter(tab.value)">
              {{ tab.label }}
            </button>
          </div>
        </div>
        <!-- Loading state -->
        <div class="loading-row" *ngIf="loading">
          <mat-spinner diameter="32"></mat-spinner>
          <span>Loading rooms...</span>
        </div>
        <!-- Table -->
        <div class="table-wrap" *ngIf="!loading">
          <table>
            <thead><tr>
              <th>ROOM NO.</th><th>FLOOR</th><th>TYPE</th>
              <th>CAPACITY</th><th>OCCUPANCY</th><th>RENT / MONTH</th>
              <th>AMENITIES</th><th>STATUS</th><th>ACTIONS</th>
            </tr></thead>
            <tbody>
              <tr *ngIf="rooms.length === 0">
                <td colspan="9" class="empty-row">No rooms found</td>
              </tr>
              <tr *ngFor="let room of rooms">
                <td class="room-no">{{ room.roomNumber }}</td>
                <td>Floor {{ room.floor }}</td>
                <td>{{ room.roomType }}</td>
                <td style="text-align:center">{{ room.maxCapacity }}</td>
                <td style="text-align:center">
                  <span [class.full]="room.occupancy >= room.maxCapacity">
                    {{ room.occupancy }}/{{ room.maxCapacity }}
                  </span>
                </td>
                <td class="rent">₹{{ room.rentAmount | number }}</td>
                <td class="amenities">{{ room.amenities || "—" }}</td>
                <td>
                  <span class="badge" [ngClass]="statusClass(room.status)">
                    {{ room.status }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="act-btn edit" matTooltip="Edit" (click)="openEdit(room)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button class="act-btn del" matTooltip="Delete" (click)="confirmDelete(room)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="deleteTarget" (click)="cancelDelete()">
        <div class="modal" (click)="$event.stopPropagation()">
          <mat-icon class="warn-icon">warning</mat-icon>
          <h3>Delete Room {{ deleteTarget?.roomNumber }}?</h3>
          <p>This action cannot be undone.</p>
          <p class="occ-warn" *ngIf="deleteTarget?.status === 'OCCUPIED'">
            ⚠ This room is OCCUPIED. Delete will be rejected by the server.
          </p>
          <div class="modal-btns">
            <button mat-stroked-button (click)="cancelDelete()">Cancel</button>
            <button mat-raised-button color="warn" (click)="executeDelete()" [disabled]="deleteLoading">
              <mat-spinner diameter="18" *ngIf="deleteLoading"></mat-spinner>
              <span *ngIf="!deleteLoading">Delete</span>
            </button>
          </div>
        </div>
      </div>
      <!-- Room Form Drawer -->
      <app-room-form *ngIf="showForm" [room]="editRoom"
        (saved)="onSaved()" (cancelled)="onCancelled()">
      </app-room-form>
    </div>
  `,
  styles: [`
    .page { max-width:1200px; margin:0 auto; }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .page-header h2 { margin:0; font-size:22px; font-weight:700; color:#111827; }
    .page-header p  { margin:2px 0 0; font-size:13px; color:#6B7280; }
    .card { background:#fff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); overflow:hidden; }
    .toolbar { display:flex; align-items:center; gap:12px; padding:16px 20px;
      border-bottom:1px solid #E5E7EB; flex-wrap:wrap; }
    .search-box { display:flex; align-items:center; gap:8px; background:#F9FAFB;
      border:1px solid #E5E7EB; border-radius:8px; padding:8px 12px; flex:1; min-width:180px; }
    .search-box mat-icon { color:#9CA3AF; font-size:18px; width:18px; height:18px; }
    .search-box input { border:none; background:none; outline:none; font-size:14px; color:#374151; flex:1; }
    .filter-tabs { display:flex; gap:4px; }
    .filter-tabs button { border:1px solid #E5E7EB; background:#fff; border-radius:6px;
      padding:6px 14px; font-size:13px; font-weight:500; color:#6B7280; cursor:pointer; transition:all 0.18s; }
    .filter-tabs button:hover { border-color:#2471A3; color:#2471A3; }
    .filter-tabs button.active { background:#1B3A6B; color:#fff; border-color:#1B3A6B; }
    .loading-row { display:flex; align-items:center; gap:12px; justify-content:center; padding:40px; color:#6B7280; }
    .table-wrap { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#F9FAFB; }
    th { padding:12px 16px; text-align:left; font-size:11px; font-weight:700;
      color:#6B7280; letter-spacing:0.5px; border-bottom:1px solid #E5E7EB; white-space:nowrap; }
    td { padding:14px 16px; font-size:14px; color:#374151;
      border-bottom:1px solid #F3F4F6; vertical-align:middle; }
    tbody tr:hover { background:#F9FAFB; }
    tbody tr:last-child td { border-bottom:none; }
    .room-no { font-weight:700; color:#1B3A6B; }
    .rent { font-weight:600; color:#1E8449; }
    .amenities { font-size:12px; color:#6B7280; max-width:180px; }
    .full { color:#EF4444; font-weight:700; }
    .empty-row { text-align:center; color:#9CA3AF; padding:40px; }
    .badge { display:inline-block; padding:4px 10px; border-radius:20px;
      font-size:11px; font-weight:700; letter-spacing:0.3px; }
    .badge-available   { background:#D5F5E3; color:#1E8449; }
    .badge-occupied    { background:#FDEBD0; color:#D35400; }
    .badge-maintenance { background:#FADBD8; color:#C0392B; }
    .actions { display:flex; gap:6px; }
    .act-btn { background:none; border:none; width:32px; height:32px; border-radius:8px;
      display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background 0.18s; }
    .act-btn mat-icon { font-size:18px; width:18px; height:18px; }
    .act-btn.edit { color:#2471A3; } .act-btn.edit:hover  { background:#D6EAF8; }
    .act-btn.del  { color:#E74C3C; } .act-btn.del:hover   { background:#FADBD8; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:900;
      display:flex; align-items:center; justify-content:center; }
    .modal { background:#fff; border-radius:12px; padding:28px; width:360px;
      text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
    .warn-icon { font-size:40px; width:40px; height:40px; color:#F59E0B; }
    .modal h3 { margin:12px 0 8px; font-size:18px; font-weight:700; color:#111827; }
    .modal p  { margin:0; font-size:14px; color:#6B7280; }
    .occ-warn { color:#D35400 !important; margin-top:8px !important; font-size:13px !important; }
    .modal-btns { display:flex; justify-content:center; gap:12px; margin-top:20px; }
    @media (max-width:768px) { .toolbar { flex-direction:column; align-items:stretch; }
      .filter-tabs { flex-wrap:wrap; } .page-header { flex-direction:column; gap:12px; } }
  `]
})
export class RoomsComponent implements OnInit {
  rooms: RoomResponse[] = [];
  loading = false; activeFilter: string | null = null; searchTerm = '';
  showForm = false; editRoom: RoomResponse | null = null;
  deleteTarget: RoomResponse | null = null; deleteLoading = false;
  filterTabs = [
    { label:'ALL', value:null }, { label:'AVAILABLE', value:'AVAILABLE' },
    { label:'OCCUPIED', value:'OCCUPIED' }, { label:'MAINTENANCE', value:'MAINTENANCE' },
  ];
  constructor(private roomService: RoomService, private snackBar: MatSnackBar, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void { this.loadRooms(); }
  loadRooms(): void {
    this.loading = true;
    this.roomService.getAll(this.activeFilter, this.searchTerm).subscribe({
      next:  r => { this.rooms = r; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
  setFilter(v: string | null): void { this.activeFilter = v; this.loadRooms(); }
  onSearch(): void { this.loadRooms(); }
  openAdd(): void  { this.editRoom = null; this.showForm = true; }
  openEdit(r: RoomResponse): void { this.editRoom = r; this.showForm = true; }
  onSaved(): void {
    this.showForm = false; this.loadRooms(); this.snackBar.open('Room saved successfully','Close',{duration:3000});
  }
  onCancelled(): void { this.showForm = false; }
  confirmDelete(r: RoomResponse): void { this.deleteTarget = r; }
  cancelDelete():                 void { this.deleteTarget = null; }
  executeDelete(): void {
    if (!this.deleteTarget) return;
    this.deleteLoading = true;
    this.roomService.delete(this.deleteTarget.id).subscribe({
      next: () => {
        this.deleteTarget = null; this.deleteLoading = false; this.loadRooms();
        this.snackBar.open('Room deleted','Close',{duration:3000});
      },
      error: (err) => {
        this.deleteLoading = false; this.deleteTarget = null;
        const msg = err.error?.message ?? 'Failed to delete room.';
        this.snackBar.open(msg,'Close',{duration:5000,panelClass:'snack-error'});
        this.cdr.detectChanges();
      }
    });
  }
  statusClass(s: string): string {
    if (s==='AVAILABLE')   return 'badge-available';
    if (s==='OCCUPIED')    return 'badge-occupied';
    if (s==='MAINTENANCE') return 'badge-maintenance';
    return '';
  }
}

