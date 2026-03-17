import {
  Component, OnInit, ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TenantService } from './tenant.service';
import { TenantFormComponent } from './tenant-form/tenant-form.component';
import { TenantResponse, TenantStats, TenantStatus } from '../../shared/models/tenant.models';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSelectModule,
    MatSnackBarModule, MatDialogModule,
    TenantFormComponent
  ],
  template: `
  <div class='page'>

    <!-- PAGE HEADER -->
    <div class='page-header'>
      <div>
        <h1>Tenant Management</h1>
        <p class='subtitle'>Manage tenant onboarding, assignments &amp; move-outs</p>
      </div>
      <button mat-flat-button color='primary' (click)='openAdd()'>
        <mat-icon>person_add</mat-icon> Add Tenant
      </button>
    </div>

    <!-- STATS CARDS -->
    @if (stats) {
      <div class='stats-row'>
        <div class='stat-card green'>
          <mat-icon>people</mat-icon>
          <div class='stat-info'>
            <span class='stat-value'>{{ stats.active }}</span>
            <span class='stat-label'>Active</span>
          </div>
        </div>
        <div class='stat-card amber'>
          <mat-icon>pending</mat-icon>
          <div class='stat-info'>
            <span class='stat-value'>{{ stats.pending }}</span>
            <span class='stat-label'>Pending</span>
          </div>
        </div>
        <div class='stat-card gray'>
          <mat-icon>person_off</mat-icon>
          <div class='stat-info'>
            <span class='stat-value'>{{ stats.inactive }}</span>
            <span class='stat-label'>Inactive</span>
          </div>
        </div>
        <div class='stat-card red'>
          <mat-icon>exit_to_app</mat-icon>
          <div class='stat-info'>
            <span class='stat-value'>{{ stats.moveOutsThisMonth }}</span>
            <span class='stat-label'>Move-Outs This Month</span>
          </div>
        </div>
      </div>
    }

    <!-- SEARCH + FILTER -->
    <div class='toolbar'>
      <div class='search-wrap'>
        <mat-icon>search</mat-icon>
        <input [(ngModel)]='searchQuery' (input)='applyFilter()'
               placeholder='Search by name, phone or room...' class='search-input'/>
        @if (searchQuery) {
          <button mat-icon-button (click)='clearSearch()'><mat-icon>clear</mat-icon></button>
        }
      </div>
      <div class='filter-tabs'>
        @for (tab of filterTabs; track tab.value) {
          <button [class.active]='activeFilter === tab.value'
                  (click)='setFilter(tab.value)'>{{ tab.label }}</button>
        }
      </div>
    </div>

    <!-- TABLE -->
    @if (loading) {
      <div class='loading-wrap'><mat-spinner diameter='40'></mat-spinner></div>
    } @else {
      <div class='table-wrap'>
        <table>
          <thead>
            <tr>
              <th>Tenant</th><th>Phone</th><th>Room</th>
              <th>Move-in</th><th>Rent/Mo</th><th>Deposit</th>
              <th>Due Day</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (t of filtered; track t.id) {
              <tr [class.overdue-row]='t.isOverdue'>
                <td>
                  <div class='tenant-name'>{{ t.fullName }}</div>
                  <div class='tenant-email'>{{ t.email }}</div>
                  @if (t.isOverdue) {
                    <span class='overdue-badge'>{{ t.daysOverdue }} days overdue</span>
                  }
                </td>
                <td>{{ t.phone }}</td>
                <td>{{ t.roomNumber ?? '—' }}</td>
                <td>{{ t.moveInDate | date:'dd MMM yyyy' }}</td>
                <td>₹{{ t.monthlyRent | number }}</td>
                <td>₹{{ t.securityDeposit | number }}</td>
                <td>{{ t.rentDueDay }}</td>
                <td><span [class]='statusClass(t.status)'>{{ t.status }}</span></td>
                <td class='actions'>
                  @if (t.status === 'PENDING') {
                    <button mat-stroked-button color='primary'
                            (click)='openAssignRoom(t)'
                            class='assign-btn'>
                      <mat-icon>meeting_room</mat-icon> Assign Room
                    </button>
                  }
                  <button mat-icon-button (click)='viewDetail(t.id)'
                          title='View Details'>
                    <mat-icon>visibility</mat-icon>
                  </button>
                  <button mat-icon-button (click)='openEdit(t)'
                          title='Edit'>
                    <mat-icon>edit</mat-icon>
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan='9' class='empty-row'>No tenants found.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- ADD / EDIT DRAWER -->
    @if (showForm) {
      <app-tenant-form
        [tenant]='editingTenant'
        (saved)='onSaved()'
        (closed)='closeForm()'
      ></app-tenant-form>
    }

    <!-- ASSIGN ROOM MODAL -->
    @if (showAssign) {
      <div class='modal-overlay' (click)='closeAssign()'>
        <div class='modal' (click)='$event.stopPropagation()'>
          <h3>Assign Room — {{ assigningTenant?.fullName }}</h3>
          <select [(ngModel)]='selectedRoomId' class='room-select'>
            <option [ngValue]='null'>Select a room...</option>
            @for (r of availableRooms; track r.id) {
              <option [ngValue]='r.id'>
                Room {{ r.roomNumber }} — {{ r.roomType }}
              </option>
            }
          </select>
          <div class='modal-actions'>
            <button mat-stroked-button (click)='closeAssign()'>Cancel</button>
            <button mat-flat-button color='primary'
                    [disabled]='!selectedRoomId || assigning'
                    (click)='confirmAssign()'>
              @if (assigning) { Assigning... } @else { Assign Room }
            </button>
          </div>
        </div>
      </div>
    }
  </div>
  `,
  styles: [`
    .page { padding:24px; }
    .page-header { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px; }
    .page-header h1 { margin:0;font-size:24px;font-weight:700;color:#1F3864; }
    .subtitle { margin:4px 0 0;color:#666;font-size:14px; }

    /* STATS */
    .stats-row { display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px; }
    .stat-card {
      display:flex;align-items:center;gap:16px;
      padding:20px;border-radius:12px;
    }
    .stat-card mat-icon { font-size:32px;width:32px;height:32px;opacity:.9; }
    .stat-info { display:flex;flex-direction:column; }
    .stat-value { font-size:28px;font-weight:700;line-height:1; }
    .stat-label { font-size:12px;margin-top:4px;opacity:.8; }
    .stat-card.green { background:#E8F5E9;color:#2E7D32; }
    .stat-card.amber { background:#FFF8E1;color:#F57F17; }
    .stat-card.gray  { background:#F5F5F5;color:#616161; }
    .stat-card.red   { background:#FFEBEE;color:#C62828; }

    /* TOOLBAR */
    .toolbar { display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-wrap:wrap; }
    .search-wrap {
      display:flex;align-items:center;gap:8px;flex:1;min-width:260px;
      background:#fff;border:1px solid #ddd;border-radius:8px;padding:6px 12px;
    }
    .search-input { border:none;outline:none;flex:1;font-size:14px; }
    .filter-tabs { display:flex;gap:4px; }
    .filter-tabs button {
      padding:6px 16px;border:1px solid #ddd;border-radius:20px;
      background:#fff;cursor:pointer;font-size:13px;transition:.2s;
    }
    .filter-tabs button.active { background:#1F3864;color:#fff;border-color:#1F3864; }

    /* TABLE */
    .loading-wrap { display:flex;justify-content:center;padding:60px; }
    .table-wrap { background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08); }
    table { width:100%;border-collapse:collapse; }
    thead tr { background:#1F3864; }
    th { color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:.5px;
         padding:12px 16px;text-align:left;font-weight:600; }
    td { padding:12px 16px;font-size:14px;border-bottom:1px solid #f0f0f0;vertical-align:middle; }
    tbody tr:hover { background:#f9f9f9; }
    .overdue-row td { background:#FFFDE7; }
    .overdue-row:hover td { background:#FFF9C4; }
    .tenant-name { font-weight:600;color:#1F3864; }
    .tenant-email { font-size:12px;color:#999;margin-top:2px; }
    .overdue-badge {
      display:inline-block;margin-top:4px;font-size:11px;
      background:#FF6F00;color:#fff;border-radius:4px;padding:1px 6px;
    }
    .empty-row { text-align:center;color:#999;padding:40px; }
    .actions { display:flex;align-items:center;gap:4px; }
    .assign-btn { font-size:12px;height:32px; }

    /* STATUS BADGES */
    .badge-active  { background:#E8F5E9;color:#2E7D32;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600; }
    .badge-pending { background:#FFF8E1;color:#F57F17;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600; }
    .badge-inactive{ background:#F5F5F5;color:#757575;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600; }

    /* MODAL */
    .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;
      display:flex;align-items:center;justify-content:center; }
    .modal { background:#fff;border-radius:12px;padding:28px;min-width:340px;
      box-shadow:0 8px 32px rgba(0,0,0,.18); }
    .modal h3 { margin:0 0 16px;font-size:18px;color:#1F3864; }
    .room-select { width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:14px; }
    .modal-actions { display:flex;justify-content:flex-end;gap:12px;margin-top:20px; }
  `]
})
export class TenantsComponent implements OnInit {
  private tenantService = inject(TenantService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Data
  tenants: TenantResponse[] = [];
  filtered: TenantResponse[] = [];
  stats: TenantStats | null = null;
  availableRooms: any[] = [];
  loading = true;

  // Filter / search state
  searchQuery = '';
  activeFilter: TenantStatus | 'ALL' = 'ALL';
  filterTabs = [
    { label: 'All', value: 'ALL' as const },
    { label: 'Active', value: 'ACTIVE' as const },
    { label: 'Pending', value: 'PENDING' as const },
    { label: 'Inactive', value: 'INACTIVE' as const },
  ];

  // Form drawer state
  showForm = false;
  editingTenant: any = null;

  // Assign room modal state
  showAssign = false;
  assigningTenant: TenantResponse | null = null;
  selectedRoomId: number | null = null;
  assigning = false;

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.tenantService.getAll().subscribe(data => {
      this.tenants = data;
      this.applyFilter();
      this.loading = false;
      this.cdr.detectChanges();
    });
    this.tenantService.getStats().subscribe(s => {
      this.stats = s;
      this.cdr.detectChanges();
    });
  }

  applyFilter() {
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = this.tenants.filter(t => {
      const matchStatus = this.activeFilter === 'ALL' || t.status === this.activeFilter;
      const matchSearch = !q ||
        t.fullName.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        (t.roomNumber ?? '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }

  setFilter(val: TenantStatus | 'ALL') { this.activeFilter = val; this.applyFilter(); }
  clearSearch() { this.searchQuery = ''; this.applyFilter(); }

  statusClass(s: TenantStatus) {
    return { 'badge-active': s==='ACTIVE', 'badge-pending': s==='PENDING', 'badge-inactive': s==='INACTIVE' };
  }

  openAdd() { this.editingTenant = null; this.showForm = true; }
  openEdit(t: TenantResponse) {
    this.tenantService.getById(t.id).subscribe(detail => {
      this.editingTenant = detail; this.showForm = true; this.cdr.detectChanges();
    });
  }
  closeForm() { this.showForm = false; }
  onSaved() { this.closeForm(); this.loadAll(); this.snackBar.open('Tenant saved!', 'OK', { duration: 3000 }); }

  viewDetail(id: number) { this.router.navigate(['/dashboard/tenants', id]); }

  openAssignRoom(t: TenantResponse) {
    this.assigningTenant = t;
    this.selectedRoomId = null;
    this.tenantService.getAvailableRooms().subscribe(r => {
      this.availableRooms = r;
      this.showAssign = true;
      this.cdr.detectChanges();
    });
  }
  closeAssign() { this.showAssign = false; this.assigningTenant = null; }
  confirmAssign() {
    if (!this.assigningTenant || !this.selectedRoomId) return;
    this.assigning = true;
    this.tenantService.assignRoom(this.assigningTenant.id, this.selectedRoomId).subscribe({
      next: () => {
        this.assigning = false; this.closeAssign(); this.loadAll();
        this.snackBar.open('Room assigned!', 'OK', { duration: 3000 });
      },
      error: () => { this.assigning = false; }
    });
  }
}

