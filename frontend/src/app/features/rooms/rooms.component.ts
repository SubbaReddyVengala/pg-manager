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
    <div class="rooms-page animate-in">
      <div class="header">
        <div class="page-context">
          <h2 class="title">Room Inventory</h2>
          <p class="subtitle">Manage building capacity and maintenance</p>
        </div>
        <div class="header-actions">
           <div class="view-toggle">
            <button [class.active]="viewMode === 'GRID'" (click)="viewMode = 'GRID'" title="Grid View">
              <mat-icon>grid_view</mat-icon>
            </button>
            <button [class.active]="viewMode === 'LIST'" (click)="viewMode = 'LIST'" title="List View">
              <mat-icon>format_list_bulleted</mat-icon>
            </button>
          </div>
          <button mat-flat-button color="primary" class="add-room-btn" (click)="openAdd()">
            <mat-icon>add</mat-icon> Add Room
          </button>
        </div>
      </div>

      <!-- TOOLBAR -->
      <div class="toolbar glass">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search room number..." [(ngModel)]="searchQuery" (input)="applyFilter()">
        </div>
        <div class="filter-tabs">
          <button *ngFor="let t of tabs" [class.active]="activeTab === t" (click)="setTab(t)">{{ t }}</button>
        </div>
        <div class="list-count" *ngIf="rooms.length > 0">
          Total {{ filteredRooms.length }} rooms
        </div>
      </div>

      <!-- GRID VIEW -->
      <div class="grid-container" *ngIf="viewMode === 'GRID' && filteredRooms.length > 0">
        <div class="floor-section" *ngFor="let floor of floors">
          <div class="floor-header">
             <span class="floor-label">FLOOR {{ floor }}</span>
             <span class="floor-count">{{ getRoomsOnFloor(floor).length }} rooms</span>
          </div>
          <div class="room-grid">
            <div class="room-cell glass hover-lift" *ngFor="let r of getRoomsOnFloor(floor)" 
                 [class]="r.status.toLowerCase()"
                 (click)="viewRoom(r)">
              <div class="room-top">
                <span class="room-id">{{ r.roomNumber }}</span>
                <span class="room-occ">{{ r.occupancy }}/{{ r.maxCapacity }}</span>
              </div>
              <div class="room-type">{{ r.roomType }}</div>
              <div class="room-footer">
                <span class="status-dot"></span>
                <span class="status-txt">{{ r.status }}</span>
              </div>
              <div class="room-hover-actions">
                 <button (click)="$event.stopPropagation(); openEdit(r)"><mat-icon>edit</mat-icon></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- LIST VIEW -->
      <div class="table-wrap" *ngIf="viewMode === 'LIST' && filteredRooms.length > 0">
        <table>
          <thead>
            <tr>
              <th>ROOM</th>
              <th>FLOOR</th>
              <th>TYPE</th>
              <th>OCCUPANCY</th>
              <th>RENT/MO</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of filteredRooms">
              <td class="room-num">{{ r.roomNumber }}</td>
              <td>Floor {{ r.floor }}</td>
              <td>{{ r.roomType }}</td>
              <td>
                 <div class="occ-stack">
                    <span>{{ r.occupancy }}/{{ r.maxCapacity }} beds</span>
                    <div class="occ-bar"><div class="occ-fill" [style.width]="((r.occupancy/r.maxCapacity)*100) + '%'"></div></div>
                 </div>
              </td>
              <td class="rent-cell currency">₹{{ r.rentAmount | number }}</td>
              <td><span class="status-badge" [class]="r.status.toLowerCase()">{{ r.status }}</span></td>
              <td class="actions">
                <button class="icon-btn view" (click)="viewRoom(r)"><mat-icon>visibility</mat-icon></button>
                <button class="icon-btn edit" (click)="openEdit(r)"><mat-icon>edit</mat-icon></button>
                <button class="icon-btn delete" (click)="deleteRoom(r)" 
                        [class.disabled]="r.status !== 'AVAILABLE' || r.occupancy > 0">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- PAGINATION CONTROLS -->
        <div class="pagination-bar" *ngIf="viewMode === 'LIST' && totalPages > 1">
          <div class="pag-info">Showing {{ (currentPage * pageSize) + 1 }}–{{ Math.min((currentPage + 1) * pageSize, totalElements) }} of {{ totalElements }}</div>
          <div class="pag-buttons">
            <button [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)"><mat-icon>chevron_left</mat-icon></button>
            <button *ngFor="let p of [].constructor(totalPages); let i = index" 
                    [class.active]="i === currentPage" 
                    (click)="goToPage(i)">{{ i + 1 }}</button>
            <button [disabled]="currentPage === totalPages - 1" (click)="goToPage(currentPage + 1)"><mat-icon>chevron_right</mat-icon></button>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <app-empty-state
        *ngIf="filteredRooms.length === 0"
        [icon]="searchQuery ? 'search_off' : 'meeting_room'"
        [title]="searchQuery ? 'No rooms match your search' : 'No rooms added yet'"
        [description]="searchQuery ? 'Try checking for typos or clearing filters' : 'Add your PG rooms to start managing occupancy'"
        [actionText]="!searchQuery ? 'Add First Room' : ''"
        (actionClicked)="openAdd()"
        padding="120px 20px"
      ></app-empty-state>

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
                <select formControlName="roomType">
                  <option value="SINGLE">SINGLE</option>
                  <option value="DOUBLE">DOUBLE</option>
                  <option value="TRIPLE">TRIPLE</option>
                </select>
              </div>
              <div class="field">
                <label>Max Capacity *</label>
                <input type="number" formControlName="maxCapacity">
              </div>
            </div>

            <div class="field">
              <label>Monthly Rent (₹) *</label>
              <input type="number" formControlName="rentAmount">
            </div>

            <p class="section-title" style="margin-top: 24px;">AMENITIES (OPTIONAL)</p>
            <div class="field">
              <label>Amenities</label>
              <input type="text" formControlName="amenities" placeholder="e.g. AC, WiFi, Geyser">
            </div>

            <div class="field">
              <label>Status *</label>
              <select formControlName="status">
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

      <!-- VIEW DRAWER -->
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
                <span class="rent-text currency">₹{{ viewingRoom.rentAmount | number }}</span>
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
                    {{ bed.tenant ? bed.tenant.fullName : (viewingRoom.status === 'MAINTENANCE' ? 'Maintenance' : 'Available') }}
                  </span>
                </div>
              </div>
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
    .rooms-page { padding: 24px; background: transparent; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .title { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
    .subtitle { margin: 2px 0 0; font-size: 13px; color: #64748b; font-weight: 500; }
    .add-room-btn { border-radius: 8px; font-weight: 700; height: 42px; background: #1e293b !important; }

    .header-actions { display: flex; align-items: center; gap: 16px; }
    .view-toggle { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; }
    .view-toggle button { border: none; background: transparent; padding: 6px 10px; border-radius: 8px; cursor: pointer; color: #64748b; display: flex; align-items: center; transition: all 0.2s; }
    .view-toggle button.active { background: white; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .view-toggle mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .search-wrap { display: flex; align-items: center; gap: 12px; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0 16px; flex: 1; max-width: 320px; height: 44px; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .search-wrap:focus-within { border-color: #1e293b; background: white; }
    .search-wrap input { border: none; outline: none; font-size: 14px; flex: 1; background: transparent; }
    .filter-tabs { display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px; }
    .filter-tabs button { border: none; background: transparent; padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; }
    .filter-tabs button.active { background: #1e293b; color: white; }
    .list-count { font-size: 12px; font-weight: 600; color: #94a3b8; margin-left: auto; }
    
    .floor-section { margin-bottom: 32px; }
    .floor-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .floor-label { font-size: 11px; font-weight: 800; color: #1e293b; letter-spacing: 1px; }
    .floor-count { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
    
    .room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
    .room-cell { background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
    .room-cell:hover { transform: translateY(-3px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .room-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .room-id { font-size: 15px; font-weight: 800; color: #0f172a; }
    .room-occ { font-size: 10px; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 6px; }
    .room-type { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .room-cell.available { border-bottom: 4px solid #10b981; }
    .room-cell.occupied { border-bottom: 4px solid #3b82f6; }
    .room-cell.maintenance { border-bottom: 4px solid #f59e0b; background: #fffbeb; }
    
    .room-hover-actions { position: absolute; inset: 0; background: rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; }
    .room-cell:hover .room-hover-actions { opacity: 1; }
    .room-hover-actions button { border: 1px solid #e2e8f0; background: white; border-radius: 50%; padding: 6px; color: #64748b; cursor: pointer; display: flex; }

    .occ-stack { display: flex; flex-direction: column; gap: 4px; width: 80px; }
    .occ-bar { height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden; }
    .occ-fill { height: 100%; background: #3b82f6; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 20px; font-size: 11px; font-weight: 700; color: #94a3b8; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; }
    td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #475569; vertical-align: middle; }
    .room-num { font-weight: 700; color: #1e293b; }
    .rent-cell { font-weight: 700; color: #10b981; }
    .status-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 12px; }
    .status-badge.available { color: #10b981; background: #ecfdf5; }
    .status-badge.occupied { color: #3b82f6; background: #eff6ff; }
    .status-badge.maintenance { color: #f59e0b; background: #fffbeb; }

    /* ACTION BUTTONS MODERNIZATION */
    .actions { display: flex; align-items: center; gap: 8px; }
    .icon-btn { 
      width: 32px; height: 32px; 
      border-radius: 50%; border: none; 
      display: flex; align-items: center; justify-content: center; 
      cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      background: transparent; color: #64748b;
    }
    .icon-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    
    .icon-btn.view:hover { background: #eff6ff; color: #3b82f6; transform: translateY(-1px); }
    .icon-btn.edit:hover { background: #f1f5f9; color: #1e293b; transform: translateY(-1px); }
    .icon-btn.delete:hover { background: #fef2f2; color: #ef4444; transform: translateY(-1px); }
    .icon-btn.disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; }

    .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .pag-info { font-size: 12px; color: #64748b; font-weight: 600; }
    .pag-buttons { display: flex; align-items: center; gap: 4px; }
    .pag-buttons button { border: 1px solid #e2e8f0; background: white; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .pag-buttons button:hover:not(:disabled) { border-color: #1e293b; color: #1e293b; }
    .pag-buttons button.active { background: #1e293b; border-color: #1e293b; color: white; }
    .pag-buttons button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pag-buttons button mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 1000; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.1); padding: 32px; display: flex; flex-direction: column; }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .drawer-header h2 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
    .close-x { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
    .section-title { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    .drawer-form { display: flex; flex-direction: column; gap: 16px; flex: 1; overflow-y: auto; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 12px; font-weight: 600; color: #64748b; }
    .field input, .field select { border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; transition: 0.2s; }
    .field input:focus, .field select:focus { border-color: #3b82f6; background: white; }
    .drawer-actions { margin-top: auto; display: flex; gap: 12px; padding-top: 32px; }
    .btn-cancel { flex: 1; border: 1px solid #e2e8f0; background: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-submit { flex: 1.5; border: none; background: #1e293b; color: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-submit:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }

    .view-content { display: flex; flex-direction: column; gap: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 16px; border-radius: 12px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-item label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    .info-item span { font-size: 14px; font-weight: 600; color: #1e293b; }
    .bed-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .bed-item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; }
    .bed-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: #ecfdf5; color: #10b981; border-radius: 8px; }
    .bed-info { display: flex; flex-direction: column; }
    .bed-label { font-size: 11px; font-weight: 700; color: #94a3b8; }
    .tenant-name { font-size: 13px; font-weight: 600; color: #475569; }
    .bed-item.occupied .bed-icon { background: #fef2f2; color: #ef4444; }
  `]
})
export class RoomsComponent implements OnInit, OnDestroy {
  private roomService = inject(RoomService);
  private tenantService = inject(TenantService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();
  protected readonly Math = Math;

  rooms: any[] = [];
  filteredRooms: any[] = [];
  floors: number[] = [];
  viewMode: 'GRID' | 'LIST' = 'GRID';
  searchQuery = '';
  activeTab = 'ALL';
  tabs = ['ALL', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];
  
  // Pagination State
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

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
    this.roomService.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadRooms());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadRooms(): void {
    // If Grid view, we might want to load more for now or stick to pagination
    this.roomService.getRooms(this.activeTab, this.searchQuery, this.currentPage, this.pageSize).subscribe(res => {
      this.rooms = res.content;
      this.filteredRooms = res.content;
      this.totalElements = res.totalElements;
      this.totalPages = res.totalPages;
      this.floors = [...new Set(res.content.map(r => r.floor))].sort((a, b) => a - b);
      this.cdr.detectChanges();
    });
  }

  getRoomsOnFloor(floor: number): any[] {
    return this.filteredRooms.filter(r => r.floor === floor);
  }

  applyFilter(): void {
    this.currentPage = 0;
    this.loadRooms();
  }

  setTab(t: string): void { 
    this.activeTab = t; 
    this.applyFilter(); 
  }

  goToPage(p: number): void {
    this.currentPage = p;
    this.loadRooms();
  }

  viewRoom(room: any): void {
    this.viewingRoom = room;
    this.beds = [];
    for (let i = 0; i < room.maxCapacity; i++) {
      this.beds.push({ id: i + 1, tenant: null });
    }
    this.tenantService.getTenantsByRoom(room.id).subscribe(tenants => {
      tenants.forEach((t, index) => { if (this.beds[index]) this.beds[index].tenant = t; });
      this.showViewDrawer = true;
      this.cdr.detectChanges();
    });
  }

  closeViewDrawer(): void { this.showViewDrawer = false; this.viewingRoom = null; }

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
      error: () => this.snackBar.open('Failed to save room.', 'Close', { duration: 5000 })
    });
  }

  deleteRoom(room: any): void {
    if (room.status !== 'AVAILABLE') return;
    this.roomToDelete = room;
    this.showDeleteConfirm = true;
  }

  executeDelete(): void {
    if (!this.roomToDelete) return;
    this.roomService.deleteRoom(this.roomToDelete.id).subscribe({
      next: () => {
        this.snackBar.open('Room deleted', 'OK', { duration: 3000 });
        this.loadRooms();
        this.showDeleteConfirm = false;
      },
      error: () => this.snackBar.open('Delete failed.', 'Close', { duration: 5000 })
    });
  }
}
