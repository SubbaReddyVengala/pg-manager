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
import { Subject, takeUntil, forkJoin } from 'rxjs';

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
    <div class="tenants-page">
      <div class="header">
        <div class="header-spacer"></div>
        <button mat-flat-button color="primary" class="add-btn" (click)="openAdd()">
          <mat-icon>add</mat-icon> Add Tenant
        </button>
      </div>

      <!-- STATS LOADING -->
      <div class="stats-row" *ngIf="loading && !stats">
        <div class="stat-card skeleton" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <!-- STATS -->
      <div class="stats-row" *ngIf="stats">
        <div class="stat-card active">
          <div class="st-label">ACTIVE <mat-icon class="st-check">check_circle</mat-icon></div>
          <div class="st-val">{{ stats.active }}</div>
        </div>
        <div class="stat-card pending">
          <div class="st-label">PENDING <mat-icon class="st-check">hourglass_empty</mat-icon></div>
          <div class="st-val">{{ stats.pending }}</div>
        </div>
        <div class="stat-card inactive">
          <div class="st-label">INACTIVE <mat-icon class="st-check">cancel</mat-icon></div>
          <div class="st-val">{{ stats.inactive }}</div>
        </div>
        <div class="stat-card move-outs">
          <div class="st-label">MOVE-OUTS THIS MONTH <mat-icon class="st-check">exit_to_app</mat-icon></div>
          <div class="st-val">{{ stats.moveOutsThisMonth }}</div>
        </div>
      </div>

      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search by name or phone..." [(ngModel)]="searchQuery" (input)="applyFilter()">
        </div>
        <div class="filter-tabs">
          <button *ngFor="let t of tabs" [class.active]="activeTab === t" (click)="setTab(t)">{{ t }}</button>
        </div>
      </div>

      <!-- TABLE LOADING -->
      <div class="loading-overlay" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <span>Fetching tenant records...</span>
      </div>

      <!-- TABLE -->
      <div class="table-wrap" [class.dimmed]="loading">
        <table>
          <thead>
            <tr>
              <th>TENANT</th>
              <th>PHONE</th>
              <th>ROOM</th>
              <th>MOVE-IN</th>
              <th>RENT/MO</th>
              <th>DEPOSIT</th>
              <th>DUE DATE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of filteredTenants" [class.overdue-row]="t.isOverdue">
              <td>
                <div class="tenant-name">{{ t.fullName }}</div>
                <div class="tenant-email">{{ t.email }}</div>
              </td>
              <td>{{ t.phone }}</td>
              <td class="room-link">{{ t.roomNumber || '—' }}</td>
              <td>{{ t.moveInDate | date:'dd-MMM-yy' }}</td>
              <td class="rent-val">₹{{ t.monthlyRent | number }}</td>
              <td>₹{{ t.securityDeposit | number }}</td>
              <td>
                <span *ngIf="!t.isOverdue">{{ t.rentDueDay }}st every mo</span>
                <span *ngIf="t.isOverdue" class="overdue-text"><mat-icon>warning</mat-icon> {{ t.daysOverdue }} days overdue</span>
              </td>
              <td><span class="status-badge" [class]="t.status.toLowerCase()">{{ t.status }}</span></td>
              <td class="actions">
                <button class="icon-btn view" (click)="viewDetail(t.id)"><mat-icon>visibility</mat-icon></button>
                <button class="icon-btn edit" (click)="openEdit(t)"><mat-icon>edit</mat-icon></button>
                <button *ngIf="t.status === 'PENDING'" class="assign-btn" (click)="openAssign(t)">Assign Room</button>
                <button *ngIf="t.status !== 'ACTIVE'" class="icon-btn delete" (click)="deleteTenant(t)" title="Delete Tenant"><mat-icon>delete</mat-icon></button>
              </td>
            </tr>
            <tr *ngIf="!loading && filteredTenants.length === 0">
              <td colspan="9">
                <app-empty-state
                  topImage="assets/images/tenant.png"
                  title="No tenants found"
                  description="Try changing your filters"
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
                <span class="error-text" *ngIf="tenantForm.get('fullName')?.invalid && tenantForm.get('fullName')?.touched">Required</span>
              </div>
              <div class="field">
                <label>Phone *</label>
                <input type="text" formControlName="phone" placeholder="9876543210"
                       [class.invalid]="tenantForm.get('phone')?.invalid && tenantForm.get('phone')?.touched">
                <span class="error-text" *ngIf="tenantForm.get('phone')?.invalid && tenantForm.get('phone')?.touched">Required</span>
              </div>
            </div>
            <div class="field">
              <label>Email *</label>
              <input type="email" formControlName="email" placeholder="ravi@email.com"
                     [class.invalid]="tenantForm.get('email')?.invalid && tenantForm.get('email')?.touched">
              <span class="error-text" *ngIf="tenantForm.get('email')?.invalid && tenantForm.get('email')?.touched">Valid email required</span>
            </div>

            <!-- ... (rest of form fields) -->
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
                <input type="date" formControlName="moveInDate"
                       [class.invalid]="tenantForm.get('moveInDate')?.invalid && tenantForm.get('moveInDate')?.touched">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Monthly Rent (₹) *</label>
                <input type="number" formControlName="monthlyRent"
                       [class.invalid]="tenantForm.get('monthlyRent')?.invalid && tenantForm.get('monthlyRent')?.touched">
              </div>
              <div class="field">
                <label>Security Deposit (₹) *</label>
                <input type="number" formControlName="securityDeposit"
                       [class.invalid]="tenantForm.get('securityDeposit')?.invalid && tenantForm.get('securityDeposit')?.touched">
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

            <p class="section-title" style="margin-top: 24px;">ID & EMERGENCY</p>
            <div class="form-row">
              <div class="field">
                <label>ID Proof Type</label>
                <select formControlName="idProofType">
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="VOTER">Voter ID</option>
                </select>
              </div>
              <div class="field">
                <label>ID Number</label>
                <input type="text" formControlName="idNumber" placeholder="XXXX XXXX XXXX">
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label>Emergency Contact</label>
                <input type="text" formControlName="emergencyContact" placeholder="Parent/Relative name">
              </div>
              <div class="field">
                <label>Emergency Phone</label>
                <input type="text" formControlName="emergencyPhone" placeholder="9876500000">
              </div>
            </div>
            <div class="field">
              <label>Permanent Address</label>
              <textarea formControlName="permanentAddress" rows="2" placeholder="Full address..."></textarea>
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
    .tenants-page { padding: 24px; background: #f8fafc; position: relative; min-height: 500px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .add-btn { border-radius: 8px; font-weight: 700; height: 42px; background: #1e293b !important; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; height: 100px; }
    .stat-card.skeleton { background: #f1f5f9; animation: pulse 1.5s infinite; border: none; }
    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }

    .st-label { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .st-check { font-size: 16px; width: 16px; height: 16px; color: #10b981; }
    .st-val { font-size: 28px; font-weight: 800; color: #1e293b; }
    .pending .st-check { color: #f59e0b; }
    .inactive .st-check { color: #ef4444; }
    .move-outs .st-check { color: #3b82f6; }

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
    }
    .search-wrap mat-icon { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; transition: color 0.2s; }
    .search-wrap:focus-within mat-icon { color: #1e293b; }
    .search-wrap input { border: none; outline: none; font-size: 14px; font-weight: 500; color: #1e293b; flex: 1; background: transparent; height: 100%; }
    .search-wrap input::placeholder { color: #94a3b8; }
    .filter-tabs { display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px; }
    .filter-tabs button { border: none; background: transparent; padding: 6px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #64748b; cursor: pointer; }
    .filter-tabs button.active { background: #1e293b; color: white; }

    .loading-overlay { position: absolute; top: 300px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 12px; z-index: 5; color: #64748b; font-weight: 600; font-size: 13px; }
    .dimmed { opacity: 0.4; pointer-events: none; }

    .table-wrap { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; transition: opacity 0.2s; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 14px 20px; font-size: 11px; font-weight: 700; color: #94a3b8; border-bottom: 1px solid #f1f5f9; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 16px 20px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #475569; vertical-align: middle; }
    .empty-msg { text-align: center; padding: 60px; color: #94a3b8; font-weight: 500; }
    
    .tenant-name { font-weight: 700; color: #1e293b; font-size: 14px; }
    .tenant-email { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .room-link { font-weight: 700; color: #3b82f6; }
    .rent-val { font-weight: 700; color: #10b981; }
    .overdue-row { background: #fffbeb; }
    .overdue-text { color: #ef4444; font-weight: 700; display: flex; align-items: center; gap: 4px; }
    .overdue-text mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .status-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 12px; }
    .status-badge.active { color: #10b981; background: #ecfdf5; }
    .status-badge.pending { color: #f59e0b; background: #fffbeb; }
    .status-badge.inactive { color: #ef4444; background: #fee2e2; }
    
    .actions { display: flex; gap: 8px; align-items: center; }
    .icon-btn { border: 1px solid #e2e8f0; background: white; color: #94a3b8; border-radius: 6px; padding: 4px; cursor: pointer; transition: all 0.2s; }
    .icon-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .icon-btn.view { color: #3b82f6; }
    .icon-btn.edit { color: #f59e0b; }
    .icon-btn.delete { color: #ef4444; }
    .assign-btn { background: #f5f3ff; color: #7c3aed; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; }

    /* Side Drawer */
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 1000; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 450px; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.1); padding: 32px; display: flex; flex-direction: column; overflow-y: auto; }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .drawer-header h2 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
    .close-x { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
    .section-title { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
    .drawer-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { display: flex; flex-direction: column; gap: 6px; position: relative; }
    .field label { font-size: 12px; font-weight: 600; color: #64748b; }
    .field input, .field select, .field textarea { border: 1px solid #e2e8f0; padding: 10px 12px; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; transition: all 0.2s; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #3b82f6; background: white; }
    .field input.invalid, .field select.invalid, .field textarea.invalid { border-color: #ef4444; background: #fffafb; }
    .error-text { color: #ef4444; font-size: 10px; font-weight: 600; margin-top: 2px; }

    .drawer-actions { margin-top: 32px; display: flex; gap: 12px; padding-bottom: 20px; }
    .btn-cancel { flex: 1; border: 1px solid #e2e8f0; background: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-submit { flex: 1.5; border: none; background: #1e293b; color: white; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-submit:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }
    .btn-submit:hover:not(:disabled) { background: #334155; }
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

  tenants: any[] = [];
  filteredTenants: any[] = [];
  stats: any = null;
  availableRooms: any[] = [];
  searchQuery = '';
  activeTab = 'ALL';
  tabs = ['ALL', 'ACTIVE', 'PENDING', 'INACTIVE'];
  
  showDrawer = false;
  editingTenant: any = null;
  tenantForm: FormGroup;
  loading = true;

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
      permanentAddress: ['']
    });
  }

  ngOnInit(): void { 
    this.loadData(); 

    this.roomService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
      }
      if (params['action'] === 'edit' && params['id']) {
        this.activeTab = 'ALL'; // Force ALL tab to ensure we can see the tenant being edited
        const tenantId = +params['id'];
        this.waitForTenantsAndEdit(tenantId);
      }
      this.applyFilter();
    });
  }

  private waitForTenantsAndEdit(id: number): void {
    let attempts = 0;
    const check = () => {
      const tenant = this.tenants.find(t => t.id === id);
      if (tenant) {
        this.openEdit(tenant);
      } else if (this.loading && attempts < 50) { // Max 5 seconds
        attempts++;
        setTimeout(check, 100);
      }
    };
    check();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.detectChanges();

    forkJoin({
      tenants: this.tenantService.getAll(),
      stats: this.tenantService.getStats(),
      rooms: this.tenantService.getAvailableRooms()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.tenants = res.tenants;
        this.stats = res.stats;
        this.availableRooms = res.rooms;
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tenants:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    this.filteredTenants = this.tenants.filter(t => {
      if (!t || !t.fullName) return false;
      const q = (this.searchQuery || '').toLowerCase();
      const matchSearch = t.fullName.toLowerCase().includes(q) || (t.phone && t.phone.includes(this.searchQuery));
      const matchTab = this.activeTab === 'ALL' || t.status === this.activeTab;
      return matchSearch && matchTab;
    });
    this.cdr.detectChanges();
  }

  setTab(t: string): void { this.activeTab = t; this.applyFilter(); }

  openAdd(): void {
    this.editingTenant = null;
    this.tenantForm.reset({ moveInDate: new Date().toISOString().split('T')[0], rentDueDay: 1, idProofType: 'AADHAAR' });
    this.showDrawer = true;
  }

  openEdit(tenant: any): void {
    this.editingTenant = tenant;
    this.tenantForm.patchValue(tenant);
    this.showDrawer = true;
    this.cdr.detectChanges();
  }

  viewDetail(id: number): void { this.router.navigate(['/dashboard/tenants', id]); }

  closeDrawer(): void {
    this.showDrawer = false;
    this.editingTenant = null;
    this.searchQuery = '';
    
    // Clear query params from URL so they don't persist
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null, action: null, id: null },
      queryParamsHandling: 'merge'
    });
    
    this.applyFilter();
  }

  saveTenant(): void {
    const obs = this.editingTenant 
      ? this.tenantService.updateTenant(this.editingTenant.id, this.tenantForm.value)
      : this.tenantService.createTenant(this.tenantForm.value);

    obs.subscribe({
      next: () => {
        this.snackBar.open(this.editingTenant ? 'Tenant updated' : 'Tenant created', 'OK', { duration: 3000 });
        this.loadData();
        this.closeDrawer();
      },
      error: (err) => {
        console.error('Error saving tenant:', err);
        this.snackBar.open('Failed to save tenant.', 'Close', { duration: 5000 });
      }
    });
  }

  deleteTenant(tenant: any): void {
    this.tenantToDelete = tenant;
    this.showDeleteConfirm = true;
  }

  executeDelete(): void {
    if (!this.tenantToDelete) return;
    const tenant = this.tenantToDelete;
    this.showDeleteConfirm = false;
    this.tenantToDelete = null;

    this.tenantService.deleteTenant(tenant.id).subscribe({
      next: () => {
        this.snackBar.open('Tenant deleted successfully', 'OK', { duration: 3000 });
        this.loadData();
      },
      error: (err: any) => {
        console.error('Error deleting tenant:', err);
        const msg = err.error?.message || 'Failed to delete tenant.';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  openAssign(tenant: any): void {
    this.openEdit(tenant);
  }
}
