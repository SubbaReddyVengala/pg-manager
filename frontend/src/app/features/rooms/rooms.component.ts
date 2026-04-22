import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RoomService } from '../../core/services/room.service';
import { TenantService } from '../tenants/tenant.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, 
    MatButtonModule, MatIconModule, MatSnackBarModule,
    ConfirmDialogComponent, EmptyStateComponent
  ],
  template: `
    <div class="rooms-page">
      <div class="header">
        <div class="header-spacer"></div>
        <button mat-flat-button color="primary" class="add-room-btn" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Room
        </button>
      </div>

      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search room number..." [(ngModel)]="searchQuery" (input)="applyFilter()">
        </div>
        <div class="filter-tabs">
          <button *ngFor="let t of tabs" [class.active]="activeTab === t" (click)="setTab(t)">{{ t }}</button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ROOM NO.</th>
              <th>FLOOR</th>
              <th>TYPE</th>
              <th>CAPACITY</th>
              <th>OCCUPANCY</th>
              <th>RENT / MONTH</th>
              <th>AMENITIES</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of filteredRooms">
              <td class="room-num">{{ r.roomNumber }}</td>
              <td>Floor {{ r.floor }}</td>
              <td>{{ r.roomType }}</td>
              <td>{{ r.maxCapacity }}</td>
              <td>{{ r.occupancy }}/{{ r.maxCapacity }}</td>
              <td class="rent-cell">₹{{ r.rentAmount | number }}</td>
              <td class="amenities-cell">{{ r.amenities }}</td>
              <td><span class="status-badge" [class]="r.status.toLowerCase()">{{ r.status }}</span></td>
              <td class="actions">
                <button class="icon-btn view" (click)="viewRoom(r)"><mat-icon>visibility</mat-icon></button>
                <button class="icon-btn edit" (click)="openEdit(r)"><mat-icon>edit</mat-icon></button>
                <button class="icon-btn delete" (click)="deleteRoom(r)" 
                        [class.disabled]="r.status !== 'AVAILABLE' || r.occupancy > 0"
                        [title]="r.occupancy > 0 ? 'Cannot delete room with tenants' : 'Delete Room'">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </tr>
          </tbody>
          <tbody *ngIf="filteredRooms.length === 0">
            <tr>
              <td colspan="9">
                <app-empty-state
                  topImage="assets/images/house.png"
                  title="No rooms found"
                  description="Try changing your filters"
                  actionText="Add New Room"
                  actionIcon="add"
                  (actionClicked)="openAdd()"
                ></app-empty-state>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- SIDE DRAWER (Add/Edit) -->
      <div class="drawer-overlay" *ngIf="showDrawer" (click)="closeDrawer()">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>{{ editingRoom ? 'Edit Room' : 'Add New Room' }}</h2>
            <button class="close-x" (click)="closeDrawer()"><mat-icon>close</mat-icon></button>
          </div>
          
          <form [formGroup]="roomForm" (ngSubmit)="saveRoom()" class="drawer-form">
            <p class="section-title">ROOM INFO</p>
            <div class="form-row">
              <div class="field">
                <label>Room Number *</label>
                <input type="text" formControlName="roomNumber" placeholder="e.g. 101" 
                       [class.invalid]="roomForm.get('roomNumber')?.invalid && roomForm.get('roomNumber')?.touched">
                <span class="error-text" *ngIf="roomForm.get('roomNumber')?.invalid && roomForm.get('roomNumber')?.touched">
                  Required
                </span>
              </div>
              <div class="field">
                <label>Floor *</label>
                <input type="number" formControlName="floor" placeholder="1"
                       [class.invalid]="roomForm.get('floor')?.invalid && roomForm.get('floor')?.touched">
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label>Room Type *</label>
                <select formControlName="roomType" [class.invalid]="roomForm.get('roomType')?.invalid && roomForm.get('roomType')?.touched">
                  <option value="SINGLE">SINGLE</option>
                  <option value="DOUBLE">DOUBLE</option>
                  <option value="TRIPLE">TRIPLE</option>
                </select>
              </div>
              <div class="field">
                <label>Max Capacity *</label>
                <input type="number" formControlName="maxCapacity"
                       [class.invalid]="roomForm.get('maxCapacity')?.invalid && roomForm.get('maxCapacity')?.touched">
              </div>
            </div>

            <div class="field">
              <label>Monthly Rent (₹) *</label>
              <input type="number" formControlName="rentAmount"
                     [class.invalid]="roomForm.get('rentAmount')?.invalid && roomForm.get('rentAmount')?.touched">
              <span class="error-text" *ngIf="roomForm.get('rentAmount')?.invalid && roomForm.get('rentAmount')?.touched">
                Rent amount is required
              </span>
            </div>

            <p class="section-title" style="margin-top: 24px;">AMENITIES (OPTIONAL)</p>
            <div class="field">
              <label>Amenities</label>
              <input type="text" formControlName="amenities" placeholder="e.g. AC, WiFi, Geyser">
            </div>

            <div class="field">
              <label>Initial Status *</label>
              <select formControlName="status" [class.invalid]="roomForm.get('status')?.invalid && roomForm.get('status')?.touched">
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>

            <div class="drawer-actions">
              <button type="button" class="btn-cancel" (click)="closeDrawer()">Cancel</button>
              <button type="submit" class="btn-submit" [disabled]="roomForm.invalid">
                {{ editingRoom ? 'Update Room' : 'Create Room' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- VIEW DRAWER (Room Details) -->
      <div class="drawer-overlay" *ngIf="showViewDrawer" (click)="closeViewDrawer()">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>Room {{ viewingRoom?.roomNumber }} Details</h2>
            <button class="close-x" (click)="closeViewDrawer()"><mat-icon>close</mat-icon></button>
          </div>

          <div class="view-content" *ngIf="viewingRoom">
            <div class="info-grid">
              <div class="info-item">
                <label>Status</label>
                <span class="status-badge" [class]="viewingRoom.status.toLowerCase()">{{ viewingRoom.status }}</span>
              </div>
              <div class="info-item">
                <label>Floor</label>
                <span>Floor {{ viewingRoom.floor }}</span>
              </div>
              <div class="info-item">
                <label>Type</label>
                <span>{{ viewingRoom.roomType }}</span>
              </div>
              <div class="info-item">
                <label>Rent</label>
                <span class="rent-text">₹{{ viewingRoom.rentAmount | number }} / mo</span>
              </div>
            </div>

            <p class="section-title" style="margin-top: 24px;">BED AVAILABILITY LAYOUT</p>
            <div class="bed-layout">
              <div class="bed-item" *ngFor="let bed of beds; let i = index" 
                   [class.occupied]="bed.tenant"
                   [class.maintenance]="viewingRoom.status === 'MAINTENANCE'">
                <div class="bed-icon">
                  <mat-icon>{{ viewingRoom.status === 'MAINTENANCE' ? 'construction' : 'single_bed' }}</mat-icon>
                </div>
                <div class="bed-info">
                  <span class="bed-label">Bed {{ i + 1 }}</span>
                  <span class="tenant-name">
                    {{ bed.tenant ? bed.tenant.fullName : (viewingRoom.status === 'MAINTENANCE' ? 'Under Maintenance' : 'Available') }}
                  </span>
                </div>
              </div>
            </div>

            <p class="section-title" style="margin-top: 32px;">AMENITIES</p>
            <div class="amenities-list">
              <span class="amenity-tag" *ngFor="let a of getAmenitiesList(viewingRoom.amenities)">{{ a }}</span>
              <span *ngIf="!viewingRoom.amenities" class="none">No specific amenities listed</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CONFIRM DELETE -->
      <app-confirm-dialog
        *ngIf="showDeleteConfirm"
        [title]="'Delete Room ' + roomToDelete?.roomNumber + '?'"
        message="This action cannot be undone. All data for this room will be permanently deleted."
        confirmText="Yes, Delete"
        type="danger"
        imageIcon="assets/images/trash.png"
        (confirm)="executeDelete()"
        (cancel)="showDeleteConfirm = false">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .rooms-page { padding: 24px; background: #f8fafc; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .title-wrap h1 { margin: 0; font-size: 24px; font-weight: 800; color: #1e293b; }
    .subtitle { margin: 4px 0 0; font-size: 13px; color: #64748b; }
    .add-room-btn { border-radius: 8px; font-weight: 700; height: 42px; background: #1e293b !important; }

    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .search-wrap { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      background: #ffffff; 
      border: 1.5px solid #e2e8f0; 
      border-radius: 12px; 
      padding: 0 16px; 
      flex: 1; 
      max-width: 320px; 
      height: 44px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .search-wrap:focus-within {
      border-color: #1e293b;
      box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.05);
      background: #ffffff;
    }
    .search-wrap mat-icon { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; transition: color 0.2s; }
    .search-wrap:focus-within mat-icon { color: #1e293b; }
    .search-wrap input { border: none; outline: none; font-size: 14px; font-weight: 500; color: #1e293b; flex: 1; background: transparent; height: 100%; }
    .search-wrap input::placeholder { color: #94a3b8; }
    .filter-tabs { display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px; }
    .filter-tabs button { border: none; background: transparent; padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; }
    .filter-tabs button.active { background: #1e293b; color: white; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 20px; font-size: 11px; font-weight: 700; color: #94a3b8; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #475569; vertical-align: middle; }
    .room-num { font-weight: 700; color: #1e293b; }
    .rent-cell { font-weight: 700; color: #10b981; }
    .amenities-cell { font-size: 12px; color: #94a3b8; }
    .status-badge { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; }
    .status-badge.available { color: #10b981; background: #ecfdf5; }
    .status-badge.occupied { color: #3b82f6; background: #eff6ff; }
    .status-badge.maintenance { color: #f59e0b; background: #fffbeb; }
    .actions { display: flex; gap: 8px; }
    .icon-btn { border: 1px solid #e2e8f0; background: white; color: #94a3b8; border-radius: 6px; padding: 4px; cursor: pointer; }
    .icon-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .icon-btn.edit { color: #f59e0b; }
    .icon-btn.delete { color: #ef4444; }
    .icon-btn.disabled { opacity: 0.3; cursor: not-allowed; }

    /* Side Drawer */
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 1000; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 400px; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.1); padding: 32px; display: flex; flex-direction: column; }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .drawer-header h2 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
    .close-x { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
    .section-title { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 16px; }
    .drawer-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; position: relative; }
    .field label { font-size: 12px; font-weight: 600; color: #64748b; }
    .field input, .field select { border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s; }
    .field input:focus, .field select:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
    .field input.invalid, .field select.invalid { border-color: #ef4444; background: #fffafb; }
    .error-text { color: #ef4444; font-size: 10px; font-weight: 600; margin-top: 2px; }

    .drawer-actions { margin-top: auto; display: flex; gap: 12px; padding-top: 32px; }
    .btn-cancel { flex: 1; border: 1px solid #e2e8f0; background: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-submit { flex: 1.5; border: none; background: #1e293b; color: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-submit:hover:not(:disabled) { background: #334155; }
    .btn-submit:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }

    /* View Drawer Styles */
    .view-content { display: flex; flex-direction: column; gap: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 12px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-item label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .info-item span { font-size: 14px; font-weight: 600; color: #1e293b; }
    .rent-text { color: #10b981 !important; }

    .bed-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .bed-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; transition: all 0.2s; }
    .bed-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #ecfdf5; color: #10b981; border-radius: 8px; }
    .bed-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .bed-info { display: flex; flex-direction: column; }
    .bed-label { font-size: 11px; font-weight: 700; color: #94a3b8; }
    .tenant-name { font-size: 13px; font-weight: 600; color: #475569; }

    .bed-item.occupied { border-color: #fee2e2; }
    .bed-item.occupied .bed-icon { background: #fef2f2; color: #ef4444; }
    .bed-item.occupied .tenant-name { color: #b91c1c; }

    .bed-item.maintenance { border-color: #fef3c7; background: #fffcf0; }
    .bed-item.maintenance .bed-icon { background: #fffbeb; color: #f59e0b; }
    .bed-item.maintenance .tenant-name { color: #d97706; }

    .amenities-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .amenity-tag { background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .none { font-size: 12px; font-style: italic; color: #94a3b8; }
  `]
})
export class RoomsComponent implements OnInit, OnDestroy {
  private roomService = inject(RoomService);
  private tenantService = inject(TenantService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  rooms: any[] = [];
  filteredRooms: any[] = [];
  searchQuery = '';
  activeTab = 'ALL';
  tabs = ['ALL', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];
  
  showDrawer = false;
  editingRoom: any = null;
  roomForm: FormGroup;

  showViewDrawer = false;
  viewingRoom: any = null;
  beds: any[] = [];

  showDeleteConfirm = false;
  roomToDelete: any = null;

  constructor() {
    this.roomForm = this.fb.group({
      roomNumber: ['', Validators.required],
      floor: [1, Validators.required],
      roomType: ['SINGLE', Validators.required],
      maxCapacity: [1, Validators.required],
      rentAmount: [null, Validators.required],
      amenities: [''],
      status: ['AVAILABLE', Validators.required]
    });
  }

  ngOnInit(): void { 
    this.loadRooms(); 

    // Wire up global refresh button
    this.roomService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadRooms());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRooms(): void {
    this.roomService.getRooms().subscribe(data => {
      this.rooms = data;
      this.applyFilter();
      this.cdr.detectChanges();
    });
  }

  applyFilter(): void {
    this.filteredRooms = this.rooms.filter(r => {
      if (!r || !r.roomNumber) return false;
      const matchSearch = r.roomNumber.toLowerCase().includes((this.searchQuery || '').toLowerCase());
      const matchTab = this.activeTab === 'ALL' || r.status === this.activeTab;
      return matchSearch && matchTab;
    });
  }

  setTab(t: string): void { this.activeTab = t; this.applyFilter(); }

  viewRoom(room: any): void {
    this.viewingRoom = room;
    this.beds = [];
    // Initialize empty beds
    for (let i = 0; i < room.maxCapacity; i++) {
      this.beds.push({ id: i + 1, tenant: null });
    }

    // Fetch tenants in this room
    this.tenantService.getTenantsByRoom(room.id).subscribe(tenants => {
      // Map tenants to beds
      tenants.forEach((t, index) => {
        if (this.beds[index]) {
          this.beds[index].tenant = t;
        }
      });
      this.showViewDrawer = true;
      this.cdr.detectChanges();
    });
  }

  closeViewDrawer(): void {
    this.showViewDrawer = false;
    this.viewingRoom = null;
  }

  getAmenitiesList(amenities: string): string[] {
    if (!amenities) return [];
    return amenities.split(',').map(a => a.trim()).filter(a => a);
  }

  openAdd(): void {
    this.editingRoom = null;
    this.roomForm.reset({ floor: 1, roomType: 'SINGLE', maxCapacity: 1, status: 'AVAILABLE' });
    this.showDrawer = true;
  }

  openEdit(room: any): void {
    this.editingRoom = room;
    this.roomForm.patchValue(room);
    this.showDrawer = true;
  }

  closeDrawer(): void { this.showDrawer = false; }

  saveRoom(): void {
    const obs = this.editingRoom 
      ? this.roomService.updateRoom(this.editingRoom.id, this.roomForm.value)
      : this.roomService.addRoom(this.roomForm.value);

    obs.subscribe({
      next: () => {
        this.snackBar.open(this.editingRoom ? 'Room updated' : 'Room created', 'OK', { duration: 3000 });
        this.loadRooms();
        this.closeDrawer();
      },
      error: (err) => {
        console.error('Error saving room:', err);
        this.snackBar.open('Failed to save room. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }

  deleteRoom(room: any): void {
    if (room.status !== 'AVAILABLE') {
      this.snackBar.open('Only AVAILABLE rooms can be deleted.', 'OK', { duration: 3000 });
      return;
    }
    this.roomToDelete = room;
    this.showDeleteConfirm = true;
  }

  executeDelete(): void {
    if (!this.roomToDelete) return;
    const room = this.roomToDelete;
    this.showDeleteConfirm = false;
    this.roomToDelete = null;

    this.roomService.deleteRoom(room.id).subscribe({
      next: () => {
        this.snackBar.open('Room deleted successfully', 'OK', { duration: 3000 });
        this.loadRooms();
      },
      error: (err) => {
        console.error('Error deleting room:', err);
        const msg = err.error?.message || 'Failed to delete room.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }
}
