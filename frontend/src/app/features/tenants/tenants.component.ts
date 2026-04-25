import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { TenantService } from './tenant.service';
import { RoomService } from '../../core/services/room.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Subject, takeUntil, forkJoin, debounceTime, distinctUntilChanged } from 'rxjs';
import { TenantResponse, TenantStats } from '../../shared/models/tenant.models';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, 
    MatButtonModule, MatIconModule, MatSnackBarModule, 
    MatProgressSpinnerModule, ConfirmDialogComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="tenants-page animate-in">
      <div class="header">
        <div class="page-context">
          <h2 class="title">Tenant Management</h2>
          <p class="subtitle">Active Tenant Profiles</p>
        </div>
        <div class="header-actions">
           <div class="view-toggle">
            <button [class.active]="viewMode === 'GRID'" (click)="setViewMode('GRID')" title="Grid View">
              <mat-icon>grid_view</mat-icon>
            </button>
            <button [class.active]="viewMode === 'LIST'" (click)="setViewMode('LIST')" title="List View">
              <mat-icon>format_list_bulleted</mat-icon>
            </button>
          </div>
          <button mat-flat-button color="primary" class="add-btn" (click)="openAdd()">
            <mat-icon>person_add</mat-icon> Add Tenant
          </button>
        </div>
      </div>

      <!-- STATS -->
      <div class="stats-row" *ngIf="!loadingStats && stats; else statsSkeleton">
        <div class="stat-card glass hover-lift active">
          <div class="st-label">ACTIVE <mat-icon class="st-check">check_circle</mat-icon></div>
          <div class="st-val">{{ stats.active }}</div>
        </div>
        <div class="stat-card glass hover-lift move-outs">
          <div class="st-label">MOVE-OUTS <mat-icon class="st-check">exit_to_app</mat-icon></div>
          <div class="st-val">{{ stats.moveOutsThisMonth }}</div>
        </div>
        <div class="stat-card glass hover-lift pending">
          <div class="st-label">PENDING <mat-icon class="st-check">hourglass_empty</mat-icon></div>
          <div class="st-val">{{ stats.pending }}</div>
        </div>
        <div class="stat-card glass hover-lift vacant">
          <div class="st-label">VACANCIES <mat-icon class="st-check">meeting_room</mat-icon></div>
          <div class="st-val">{{ availableRooms.length }}</div>
        </div>
      </div>

      <ng-template #statsSkeleton>
        <div class="stats-row">
          <div class="stat-card skeleton" *ngFor="let i of [1,2,3,4]"></div>
        </div>
      </ng-template>

      <!-- TOOLBAR -->
      <div class="toolbar glass">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search by name, phone or room..." [ngModel]="searchQuery" (ngModelChange)="onSearch($event)">
        </div>
        <div class="filter-tabs">
          <button *ngFor="let t of tabs" [class.active]="activeTab === t" (click)="setTab(t)">{{ t }}</button>
        </div>
        <div class="list-count" *ngIf="!loading">
          Total {{ totalElements }} tenants
        </div>
      </div>

      <!-- TABLE -->
      <div class="table-wrap" [class.compact]="viewMode === 'LIST'">
        <table *ngIf="!loading && tenants.length > 0; else emptyOrLoading">
          <thead>
            <tr>
              <th class="chk-col"><input type="checkbox" (change)="toggleAll($event)" [checked]="isAllSelected()"></th>
              <th (click)="onSort('fullName')" class="sortable">
                TENANT 
                <mat-icon *ngIf="sortField === 'fullName'">{{ sortDir === 'asc' ? 'north' : 'south' }}</mat-icon>
                <mat-icon *ngIf="sortField !== 'fullName'" class="sort-placeholder">unfold_more</mat-icon>
              </th>
              <th>PHONE</th>
              <th (click)="onSort('roomNumber')" class="sortable">
                ROOM
                <mat-icon *ngIf="sortField === 'roomNumber'">{{ sortDir === 'asc' ? 'north' : 'south' }}</mat-icon>
                <mat-icon *ngIf="sortField !== 'roomNumber'" class="sort-placeholder">unfold_more</mat-icon>
              </th>
              <th (click)="onSort('moveInDate')" class="sortable">
                MOVE-IN
                <mat-icon *ngIf="sortField === 'moveInDate'">{{ sortDir === 'asc' ? 'north' : 'south' }}</mat-icon>
                <mat-icon *ngIf="sortField !== 'moveInDate'" class="sort-placeholder">unfold_more</mat-icon>
              </th>
              <th (click)="onSort('monthlyRent')" class="sortable">
                RENT/MO
                <mat-icon *ngIf="sortField === 'monthlyRent'">{{ sortDir === 'asc' ? 'north' : 'south' }}</mat-icon>
                <mat-icon *ngIf="sortField !== 'monthlyRent'" class="sort-placeholder">unfold_more</mat-icon>
              </th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of tenants; trackBy: trackById" 
                [class.selected]="selectedIds.has(t.id)"
                [class.overdue-row]="t.isOverdue">
              <td class="chk-col"><input type="checkbox" [checked]="selectedIds.has(t.id)" (change)="toggleSelection(t.id)"></td>
              <td>
                <div class="tenant-info">
                   <div class="avatar-sm">{{ t.fullName.charAt(0) }}</div>
                   <div class="t-details">
                      <div class="tenant-name">{{ t.fullName }}</div>
                      <div class="tenant-email">{{ t.email }}</div>
                   </div>
                </div>
              </td>
              <td>{{ t.phone }}</td>
              <td class="room-num">{{ t.roomNumber ? 'Room ' + t.roomNumber : '—' }}</td>
              <td>{{ t.moveInDate | date:'dd MMM yyyy' }}</td>
              <td class="rent-val currency">₹{{ t.monthlyRent | number }}</td>
              <td><span class="status-badge" [class]="t.status.toLowerCase()">{{ t.status }}</span></td>
              <td class="actions">
                <button class="icon-btn" (click)="viewDetail(t.id)" title="View Profile"><mat-icon>visibility</mat-icon></button>
                <button class="icon-btn edit" (click)="openEdit(t)" title="Edit"><mat-icon>edit</mat-icon></button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- PAGINATION CONTROLS -->
        <div class="pagination-bar" *ngIf="!loading && totalPages > 1">
          <div class="pag-info">Showing {{ (currentPage * pageSize) + 1 }}–{{ Math.min((currentPage + 1) * pageSize, totalElements) }} of {{ totalElements }}</div>
          <div class="pag-buttons">
            <button [disabled]="currentPage === 0" (click)="goToPage(currentPage - 1)"><mat-icon>chevron_left</mat-icon></button>
            <button *ngFor="let p of getPageRange()" 
                    [class.active]="p === currentPage" 
                    (click)="goToPage(p)">{{ p + 1 }}</button>
            <button [disabled]="currentPage === totalPages - 1" (click)="goToPage(currentPage + 1)"><mat-icon>chevron_right</mat-icon></button>
          </div>
          <div class="pag-size">
            <span>Rows per page:</span>
            <select [ngModel]="pageSize" (ngModelChange)="setPageSize($event)">
              <option [value]="10">10</option>
              <option [value]="20">20</option>
              <option [value]="50">50</option>
            </select>
          </div>
        </div>

        <ng-template #emptyOrLoading>
           <div class="skel-wrap" *ngIf="loading">
              <div class="skel-row" *ngFor="let i of [1,2,3,4,5,6,7,8]"></div>
           </div>
           <app-empty-state
              *ngIf="!loading && tenants.length === 0"
              [icon]="searchQuery ? 'search_off' : 'groups'"
              [title]="searchQuery ? 'No matching tenants' : 'No tenants directory yet'"
              [description]="searchQuery ? 'Check your filters or search query' : 'Add your first tenant to start tracking rent and rooms'"
              padding="120px 20px"
            ></app-empty-state>
        </ng-template>
      </div>

      <!-- BULK ACTION BAR -->
      <div class="bulk-action-bar" *ngIf="selectedIds.size > 0">
        <div class="selection-info">
          <mat-icon>check_circle</mat-icon>
          <span>{{ selectedIds.size }} tenants selected</span>
        </div>
        <div class="bulk-actions">
           <button class="bulk-btn msg" (click)="bulkMessage()">
             <mat-icon>send</mat-icon> Send Reminder
           </button>
           <button class="bulk-btn" (click)="bulkExport()">
             <mat-icon>file_download</mat-icon> Export PDF
           </button>
           <button class="bulk-clear" (click)="clearSelection()">Clear</button>
        </div>
      </div>

      <!-- SIDE DRAWER (Add/Edit) -->
      <div class="drawer-overlay" *ngIf="showDrawer" (click)="closeDrawer()">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>{{ editingTenant ? 'Edit Tenant' : 'Add New Tenant' }}</h2>
            <button class="close-x" (click)="closeDrawer()"><mat-icon>close</mat-icon></button>
          </div>
          
          <form [formGroup]="tenantForm" (ngSubmit)="saveTenant()" class="drawer-form">
            <p class="section-title">PERSONAL DETAILS</p>
            <div class="form-row">
              <div class="field">
                <label>Full Name *</label>
                <input type="text" formControlName="fullName" placeholder="e.g. Ravi Kumar"
                       [class.invalid]="tenantForm.get('fullName')?.invalid && tenantForm.get('fullName')?.touched">
              </div>
              <div class="field">
                <label>Phone *</label>
                <input type="text" formControlName="phone" placeholder="9876543210">
              </div>
            </div>
            <div class="field">
              <label>Email *</label>
              <input type="email" formControlName="email" placeholder="ravi@email.com">
            </div>

             <p class="section-title" style="margin-top: 24px;">ROOM & RENT</p>
            <div class="form-row">
              <div class="field">
                <label>Assign Room *</label>
                <select formControlName="roomId">
                  <option [ngValue]="null">Select available room</option>
                  <option *ngFor="let r of availableRooms" [value]="r.id">Room {{ r.roomNumber }}</option>
                </select>
              </div>
              <div class="field">
                <label>Move-In Date *</label>
                <input type="date" formControlName="moveInDate">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Monthly Rent (₹) *</label>
                <input type="number" formControlName="monthlyRent">
              </div>
              <div class="field">
                <label>Security Deposit (₹) *</label>
                <input type="number" formControlName="securityDeposit">
              </div>
            </div>
            <div class="field">
              <label>Rent Due Day *</label>
              <select formControlName="rentDueDay">
                <option [value]="1">1st of every month</option>
                <option [value]="5">5th of every month</option>
                <option [value]="10">10th of every month</option>
              </select>
            </div>

            <div class="field-chk" style="margin-top: 8px;">
               <label class="chk-label">
                  <input type="checkbox" formControlName="recordInitialPayment">
                  <span>Record initial rent as PAID immediately</span>
               </label>
               <p class="chk-hint">If unchecked, a PENDING due will be created in the Payments module for you to record manually.</p>
            </div>

            <div class="drawer-actions">
              <button type="button" class="btn-cancel" (click)="closeDrawer()">Cancel</button>
              <button type="submit" class="btn-submit" [disabled]="tenantForm.invalid">{{ editingTenant ? 'Update Tenant' : 'Create Tenant' }}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- CONFIRM DELETE -->
      <app-confirm-dialog
        *ngIf="showDeleteConfirm"
        [title]="'Delete Tenant ' + tenantToDelete?.fullName + '?'"
        [message]="'This will permanently delete ' + tenantToDelete?.fullName + ' and free up the assigned room. This action cannot be undone.'"
        confirmText="Yes, Delete"
        type="danger"
        imageIcon="assets/images/door.png"
        (confirm)="executeDelete()"
        (cancel)="showDeleteConfirm = false">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .tenants-page { padding: 24px; background: transparent; position: relative; min-height: 500px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .title { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
    .subtitle { margin: 2px 0 0; font-size: 13px; color: #64748b; font-weight: 500; }
    .add-btn { border-radius: 8px; font-weight: 700; height: 42px; background: #1e293b !important; }

    .header-actions { display: flex; align-items: center; gap: 16px; }
    .view-toggle { display: flex; background: #f1f5f9; padding: 4px; border-radius: 10px; }
    .view-toggle button { border: none; background: transparent; padding: 6px 10px; border-radius: 8px; cursor: pointer; color: #64748b; display: flex; align-items: center; transition: all 0.2s; }
    .view-toggle button.active { background: white; color: #1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .view-toggle mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
    .stat-card.skeleton { background: #f1f5f9; animation: skel-pulse 1.5s infinite; border: none; min-height: 100px; }
    @keyframes skel-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

    .st-label { font-size: 10px; font-weight: 800; color: #94a3b8; letter-spacing: 1px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; text-transform: uppercase; }
    .st-check { font-size: 16px; width: 16px; height: 16px; color: #10b981; }
    .st-val { font-size: 28px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
    .pending .st-check { color: #f59e0b; }
    .vacant .st-check { color: #3b82f6; }
    .move-outs .st-check { color: #8b5cf6; }

    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .search-wrap { display: flex; align-items: center; gap: 12px; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0 16px; flex: 1; max-width: 360px; height: 44px; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .search-wrap:focus-within { border-color: #1e293b; background: white; }
    .search-wrap input { border: none; outline: none; font-size: 14px; flex: 1; background: transparent; }
    .filter-tabs { display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px; }
    .filter-tabs button { border: none; background: transparent; padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; }
    .filter-tabs button.active { background: #1e293b; color: white; }
    .list-count { font-size: 12px; font-weight: 600; color: #94a3b8; margin-left: auto; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; position: relative; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 20px; font-size: 11px; font-weight: 700; color: #94a3b8; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; }
    th.sortable { cursor: pointer; user-select: none; transition: background 0.2s; }
    th.sortable:hover { background: #f8fafc; color: #1e293b; }
    th.sortable mat-icon { font-size: 14px; width: 14px; height: 14px; vertical-align: middle; margin-left: 4px; }
    .sort-placeholder { opacity: 0; color: #cbd5e1; }
    th.sortable:hover .sort-placeholder { opacity: 1; }
    td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #475569; vertical-align: middle; transition: padding 0.2s; }
    
    .compact td { padding: 8px 20px; font-size: 13px; }
    .chk-col { width: 40px; padding-right: 0 !important; }
    tr.selected { background: #eff6ff; }
    
    .tenant-info { display: flex; align-items: center; gap: 12px; }
    .avatar-sm { width: 32px; height: 32px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #1e293b; }
    .tenant-name { font-weight: 700; color: #1e293b; }
    .tenant-email { font-size: 11px; color: #94a3b8; }
    .room-num { font-weight: 700; color: #3b82f6; }
    .rent-val { font-weight: 700; color: #10b981; }
    .status-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 12px; }
    .status-badge.active { color: #10b981; background: #ecfdf5; }
    .status-badge.pending { color: #f59e0b; background: #fffbeb; }
    .status-badge.inactive { color: #ef4444; background: #fee2e2; }

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
    .icon-btn:hover { background: #f1f5f9; color: #1e293b; transform: translateY(-1px); }
    .icon-btn.edit:hover { background: #f1f5f9; color: #1e293b; }
    .icon-btn mat-icon:first-child:not(.edit mat-icon) { color: #64748b; }
    /* Specific hover colors */
    td.actions .icon-btn:first-child:hover { background: #eff6ff; color: #3b82f6; }

    .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .pag-info { font-size: 12px; color: #64748b; font-weight: 600; }
    .pag-buttons { display: flex; align-items: center; gap: 4px; }
    .pag-buttons button { border: 1px solid #e2e8f0; background: white; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .pag-buttons button:hover:not(:disabled) { border-color: #1e293b; color: #1e293b; }
    .pag-buttons button.active { background: #1e293b; border-color: #1e293b; color: white; }
    .pag-buttons button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pag-buttons button mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .pag-size { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b; font-weight: 600; }
    .pag-size select { border: 1px solid #e2e8f0; background: white; padding: 4px 8px; border-radius: 6px; font-weight: 700; outline: none; }

    .skel-wrap { padding: 20px; }
    .skel-row { height: 48px; background: #f8fafc; border-radius: 8px; margin-bottom: 12px; animation: skel-pulse 1.5s infinite; }

    .bulk-action-bar { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); background: #1e293b; color: white; padding: 12px 24px; border-radius: 16px; display: flex; align-items: center; gap: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); z-index: 2000; animation: slideUp 0.3s ease-out; }
    @keyframes slideUp { from { transform: translate(-50%, 100px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    .selection-info { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2); padding-right: 24px; }
    .selection-info mat-icon { color: #10b981; }
    .bulk-actions { display: flex; align-items: center; gap: 12px; }
    .bulk-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .bulk-btn:hover { background: rgba(255,255,255,0.2); }
    .bulk-btn.msg { background: #3b82f6; border-color: #3b82f6; }
    .bulk-clear { background: transparent; border: none; color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; margin-left: 12px; }

    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 1000; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 450px; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.1); padding: 32px; display: flex; flex-direction: column; overflow-y: auto; }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .drawer-header h2 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
    .close-x { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
    .section-title { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    .drawer-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 12px; font-weight: 600; color: #64748b; }
    .field input, .field select, .field textarea { border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; transition: 0.2s; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #3b82f6; background: white; }
    .drawer-actions { margin-top: 32px; display: flex; gap: 12px; padding-bottom: 20px; }
    .btn-cancel { flex: 1; border: 1px solid #e2e8f0; background: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-submit { flex: 1.5; border: none; background: #1e293b; color: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }

    .field-chk { display: flex; flex-direction: column; gap: 4px; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px dashed #e2e8f0; }
    .chk-label { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #1e293b; cursor: pointer; }
    .chk-label input { width: 16px; height: 16px; cursor: pointer; }
    .chk-hint { font-size: 11px; color: #64748b; margin: 0; line-height: 1.4; }
  `]
})
export class TenantsComponent implements OnInit, OnDestroy {
  private tenantService = inject(TenantService);
  private roomService = inject(RoomService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  tenants: TenantResponse[] = [];
  stats: TenantStats | null = null;
  availableRooms: any[] = [];
  searchQuery = '';
  activeTab = 'ALL';
  tabs = ['ALL', 'ACTIVE', 'PENDING', 'INACTIVE'];
  
  // Pagination State
  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  sortField = 'fullName';
  sortDir: 'asc' | 'desc' = 'asc';
  Math = Math;

  // UI State
  viewMode: 'GRID' | 'LIST' = 'LIST';
  selectedIds = new Set<number>();
  loading = true;
  loadingStats = true;
  private searchSubject = new Subject<string>();

  showDrawer = false;
  editingTenant: any = null;
  tenantForm: FormGroup;
  showDeleteConfirm = false;
  tenantToDelete: any = null;

  constructor() {
    this.tenantForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roomId: [null],
      moveInDate: [new Date().toISOString().split('T')[0], Validators.required],
      monthlyRent: [null, Validators.required],
      securityDeposit: [null, Validators.required],
      rentDueDay: [1, Validators.required],
      idProofType: ['AADHAAR'],
      idNumber: [''],
      emergencyContact: [''],
      emergencyPhone: [''],
      permanentAddress: [''],
      recordInitialPayment: [true]
    });

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(val => {
      this.searchQuery = val;
      this.currentPage = 0;
      this.loadData();
    });
  }

  ngOnInit(): void { 
    this.handleUrlParams();
    this.loadData(); 
    this.loadStats();
    this.roomService.refresh$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadData();
      this.loadStats();
    });
    const savedMode = localStorage.getItem('tenant_view_mode');
    if (savedMode) this.viewMode = savedMode as any;
  }

  private handleUrlParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      if (params['action'] === 'edit' && params['id']) {
        const id = +params['id'];
        // Fetch full details to populate form accurately
        this.tenantService.getById(id).subscribe({
          next: (tenant) => {
            if (tenant) {
              this.openEdit(tenant);
              // Clean URL params to prevent re-opening on refresh
              this.router.navigate([], { relativeTo: this.route, queryParams: { action: null, id: null }, queryParamsHandling: 'merge' });
            }
          }
        });
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  setViewMode(mode: 'GRID' | 'LIST'): void {
    this.viewMode = mode;
    localStorage.setItem('tenant_view_mode', mode);
  }

  toggleSelection(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  toggleAll(event: any): void {
    if (event.target.checked) this.tenants.forEach(t => this.selectedIds.add(t.id));
    else this.selectedIds.clear();
  }

  isAllSelected(): boolean {
    return this.tenants.length > 0 && this.tenants.every(t => this.selectedIds.has(t.id));
  }

  clearSelection(): void { this.selectedIds.clear(); }

  bulkMessage(): void {
    this.snackBar.open(`Sending reminders to ${this.selectedIds.size} tenants...`, 'OK', { duration: 3000 });
    this.clearSelection();
  }

  bulkExport(): void {
    this.snackBar.open(`Exporting PDF for ${this.selectedIds.size} tenants...`, 'OK', { duration: 3000 });
    this.clearSelection();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.detectChanges();
    const sort = `${this.sortField},${this.sortDir}`;
    this.tenantService.getAll(this.currentPage, this.pageSize, this.activeTab, this.searchQuery, sort)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.tenants = res.content;
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.currentPage = 0;
    this.loadData();
  }

  loadStats(): void {
    this.loadingStats = true;
    forkJoin({
      stats: this.tenantService.getStats(),
      rooms: this.tenantService.getAvailableRooms()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.stats = res.stats;
        this.availableRooms = res.rooms;
        this.loadingStats = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(t: string): void { 
    this.activeTab = t; 
    this.currentPage = 0;
    this.loadData(); 
  }

  onSearch(val: string): void { this.searchSubject.next(val); }

  goToPage(p: number): void {
    this.currentPage = p;
    this.loadData();
  }

  setPageSize(s: number): void {
    this.pageSize = s;
    this.currentPage = 0;
    this.loadData();
  }

  getPageRange(): number[] {
    const range = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  trackById(index: number, item: any): number { return item.id; }
  viewDetail(id: number): void { this.router.navigate(['/dashboard/tenants', id]); }

  openAdd(): void {
    this.editingTenant = null;
    this.tenantForm.reset({ moveInDate: new Date().toISOString().split('T')[0], rentDueDay: 1, idProofType: 'AADHAAR' });
    this.showDrawer = true;
  }

  openEdit(tenant: any): void {
    this.editingTenant = tenant;
    this.tenantForm.patchValue(tenant);
    this.showDrawer = true;
  }

  closeDrawer(): void { this.showDrawer = false; this.editingTenant = null; }

  saveTenant(): void {
    const obs = this.editingTenant 
      ? this.tenantService.updateTenant(this.editingTenant.id, this.tenantForm.value)
      : this.tenantService.createTenant(this.tenantForm.value);

    obs.subscribe({
      next: () => {
        this.snackBar.open(this.editingTenant ? 'Tenant updated' : 'Tenant created', 'OK', { duration: 3000 });
        this.loadData();
        this.loadStats();
        this.closeDrawer();
      },
      error: () => this.snackBar.open('Failed to save tenant.', 'Close', { duration: 5000 })
    });
  }

  deleteTenant(tenant: any): void { this.tenantToDelete = tenant; this.showDeleteConfirm = true; }
  executeDelete(): void {
    if (!this.tenantToDelete) return;
    this.tenantService.deleteTenant(this.tenantToDelete.id).subscribe({
      next: () => {
        this.snackBar.open('Tenant deleted', 'OK', { duration: 3000 });
        this.loadData();
        this.loadStats();
        this.showDeleteConfirm = false;
      },
      error: () => this.snackBar.open('Delete failed.', 'Close', { duration: 5000 })
    });
  }
}
