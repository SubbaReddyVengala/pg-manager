import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MaintenanceService, NetProfitResponse } from '../../core/services/maintenance.service';
import { RoomService } from '../../core/services/room.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Subject, takeUntil, Observable, startWith, map } from 'rxjs';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, 
    MatSnackBarModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatAutocompleteModule, EmptyStateComponent
  ],
  template: `
    <div class="expense-page animate-in">
      <!-- TOOLBAR -->
      <div class="toolbar glass">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search by category or description..." [(ngModel)]="searchQuery" (input)="applyFilter()">
        </div>
        <div class="spacer"></div>
        <div class="toolbar-actions">
           <button class="add-btn" (click)="showAddForm = true">
             <mat-icon>add</mat-icon> Add Expense
           </button>
        </div>
      </div>

      <!-- SUMMARY CARDS -->
      <div class="stats-grid" *ngIf="profit">
        <div class="stat-card glass hover-lift total-income">
          <div class="st-icon-bg green"><mat-icon>payments</mat-icon></div>
          <div class="st-info">
             <div class="st-label">Total Revenue</div>
             <div class="st-val">₹{{ profit.totalRevenue | number }}</div>
          </div>
        </div>
        <div class="stat-card glass hover-lift total-expenses">
          <div class="st-icon-bg red"><mat-icon>receipt_long</mat-icon></div>
          <div class="st-info">
             <div class="st-label">Total Costs</div>
             <div class="st-val">₹{{ (profit.totalGeneralExpenses + profit.totalMaintenanceCost) | number }}</div>
          </div>
        </div>
        <div class="stat-card glass hover-lift net-profit">
          <div class="st-icon-bg purple"><mat-icon>auto_graph</mat-icon></div>
          <div class="st-info">
             <div class="st-label">Net Profit</div>
             <div class="st-val">₹{{ profit.netProfit | number }}</div>
          </div>
        </div>
      </div>

      <div class="main-content">
        <!-- EXPENSE LIST -->
        <div class="expense-list-section glass">
          <div class="section-header">
             <h3>{{ currentMonthLabel }} Records</h3>
             <span class="count-badge">{{ expenses.length }} entries</span>
          </div>
          
          <div class="loading-center" *ngIf="loading">
            <mat-spinner diameter="32"></mat-spinner>
          </div>
          
          <div class="expense-list" *ngIf="!loading">
            <div class="expense-item hover-lift" *ngFor="let ex of expenses">
              <div class="ex-icon" [style.background-color]="getCategoryBg(ex.category)">
                <mat-icon [style.color]="getCategoryColor(ex.category)">{{ getCategoryIcon(ex.category) }}</mat-icon>
              </div>
              <div class="ex-details">
                <div class="ex-cat">{{ formatCategory(ex.category) }}</div>
                <div class="ex-desc">{{ ex.description }}</div>
                <div class="ex-date"><mat-icon>calendar_today</mat-icon> {{ ex.expenseDate | date:'dd MMM yyyy' }}</div>
              </div>
              <div class="ex-amount">₹{{ ex.amount | number }}</div>
            </div>

            <div class="total-summary-row">
              <span class="total-label">MONTHLY TOTAL</span>
              <span class="total-val">₹{{ totalExpenses | number }}</span>
            </div>

            <div class="empty-container" *ngIf="expenses.length === 0">
              <app-empty-state
                icon="receipt_long"
                title="No expenses recorded"
                description="You haven't added any expenses for this month yet."
                padding="60px 20px"
              ></app-empty-state>
            </div>
          </div>
        </div>

        <!-- BREAKDOWN & MARGIN -->
        <div class="side-section">
           <div class="breakdown-card glass">
              <h3>Expense Breakdown</h3>
              <div class="breakdown-list">
                <div class="breakdown-item" *ngFor="let item of breakdown">
                  <div class="br-header">
                    <span class="br-label">{{ item.label }}</span>
                    <span class="br-pct">{{ item.percentage }}%</span>
                  </div>
                  <div class="br-bar">
                    <div class="br-fill" [style.width]="item.percentage + '%'" [style.background-color]="item.color"></div>
                  </div>
                </div>
                <div class="empty-breakdown" *ngIf="breakdown.length === 0">
                   <p>Add expenses to see breakdown</p>
                </div>
              </div>
           </div>

           <div class="profit-summary-card glass">
              <p class="summary-label">PROFIT MARGIN 🎯</p>
              <h2 class="summary-value">{{ profitMargin }}%</h2>
              <p class="summary-desc">Efficiency for {{ currentMonthLabel }}</p>
           </div>
        </div>
      </div>

      <!-- ADD EXPENSE OVERLAY -->
      <div class="drawer-overlay" *ngIf="showAddForm" (click)="showAddForm = false">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
             <h2>Record Expense</h2>
             <button class="close-x" (click)="showAddForm = false"><mat-icon>close</mat-icon></button>
          </div>
          
          <form [formGroup]="expenseForm" (ngSubmit)="onAddExpense()" class="drawer-form">
            <div class="field">
              <label>Category *</label>
              <mat-form-field appearance="outline">
                <input type="text" placeholder="Select or type category" matInput formControlName="category" [matAutocomplete]="auto">
                <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayCategory">
                  <mat-option *ngFor="let option of filteredCategories$ | async" [value]="option">
                    {{option.label}}
                  </mat-option>
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <div class="field">
              <label>Description *</label>
              <input type="text" formControlName="description" placeholder="e.g. Monthly Electricity Bill" class="custom-input">
            </div>

            <div class="form-row">
              <div class="field">
                <label>Amount (₹) *</label>
                <input type="number" formControlName="amount" class="custom-input">
              </div>
              <div class="field">
                <label>Expense Date *</label>
                <input type="date" formControlName="expenseDate" class="custom-input">
              </div>
            </div>

            <div class="drawer-actions">
              <button class="btn-cancel" type="button" (click)="showAddForm = false">Cancel</button>
              <button class="btn-submit" type="submit" [disabled]="expenseForm.invalid || adding">
                {{ adding ? 'Saving...' : 'Add Expense' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .expense-page { padding: 24px; background: transparent; min-height: 100vh; }
    .glass { background: rgba(255, 255, 255, 0.7) !important; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.5) !important; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important; }
    .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -10px rgba(0,0,0,0.1) !important; border-color: #3b82f6 !important; }

    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding: 12px 20px; border-radius: 16px; }
    .search-wrap { display: flex; align-items: center; gap: 12px; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0 16px; flex: 1; max-width: 360px; height: 44px; transition: all 0.2s; }
    .search-wrap:focus-within { border-color: #3b82f6; }
    .search-wrap input { border: none; outline: none; font-size: 14px; flex: 1; background: transparent; }
    .add-btn { display: flex; align-items: center; gap: 8px; background: #1e293b; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .add-btn:hover { background: #0f172a; transform: translateY(-1px); }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
    .stat-card { display: flex; align-items: center; gap: 16px; padding: 24px; border-radius: 16px; }
    .st-icon-bg { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .st-icon-bg.green { background: #ecfdf5; color: #10b981; }
    .st-icon-bg.red { background: #fef2f2; color: #ef4444; }
    .st-icon-bg.purple { background: #f5f3ff; color: #8b5cf6; }
    .st-label { font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 4px; text-transform: uppercase; }
    .st-val { font-size: 24px; font-weight: 800; color: #1e293b; font-family: 'JetBrains Mono', monospace; }

    .main-content { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }
    .expense-list-section { background: #fff; border-radius: 20px; padding: 24px; border: 1px solid #e2e8f0; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .section-header h3 { margin: 0; font-size: 16px; font-weight: 800; color: #1e293b; }
    .count-badge { font-size: 11px; font-weight: 700; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 20px; }

    .expense-item { display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 12px; background: white; border: 1px solid #f8fafc; margin-bottom: 12px; }
    .ex-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ex-details { flex: 1; min-width: 0; }
    .ex-cat { font-size: 14px; font-weight: 700; color: #1e293b; }
    .ex-desc { font-size: 12px; color: #64748b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ex-date { font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 4px; margin-top: 4px; }
    .ex-date mat-icon { font-size: 12px; width: 12px; height: 12px; }
    .ex-amount { font-size: 16px; font-weight: 800; color: #ef4444; font-family: 'JetBrains Mono', monospace; }

    .total-summary-row { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding: 20px; background: #fef2f2; border-radius: 12px; }
    .total-label { font-size: 12px; font-weight: 800; color: #991b1b; letter-spacing: 1px; }
    .total-val { font-size: 20px; font-weight: 900; color: #dc2626; }

    .side-section { display: flex; flex-direction: column; gap: 24px; }
    .breakdown-card { border-radius: 20px; padding: 24px; }
    .breakdown-card h3 { margin: 0 0 20px; font-size: 15px; font-weight: 700; color: #1e293b; }
    .breakdown-list { display: flex; flex-direction: column; gap: 16px; }
    .br-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .br-label { font-size: 12px; color: #64748b; font-weight: 600; }
    .br-pct { font-size: 12px; font-weight: 700; color: #1e293b; }
    .br-bar { width: 100%; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
    .br-fill { height: 100%; border-radius: 3px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }

    .profit-summary-card { background: #22c55e !important; color: white !important; border-radius: 20px; padding: 24px; text-align: center; }
    .summary-label { font-size: 11px; font-weight: 800; opacity: 0.8; letter-spacing: 1px; margin-bottom: 8px; }
    .summary-value { font-size: 36px; font-weight: 900; margin: 0; font-family: 'JetBrains Mono', monospace; }
    .summary-desc { font-size: 12px; opacity: 0.8; margin-top: 4px; }

    /* Modal / Drawer */
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); z-index: 1000; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.1); padding: 32px; display: flex; flex-direction: column; }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .drawer-header h2 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
    .close-x { border: none; background: transparent; color: #94a3b8; cursor: pointer; }
    .drawer-form { display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 12px; font-weight: 700; color: #64748b; }
    .custom-input { border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; font-size: 14px; background: #f8fafc; transition: 0.2s; outline: none; }
    .custom-input:focus { border-color: #3b82f6; background: white; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .drawer-actions { margin-top: 32px; display: flex; gap: 12px; }
    .btn-cancel { flex: 1; border: 1px solid #e2e8f0; background: white; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; }
    .btn-submit { flex: 1.5; border: none; background: #1e293b; color: white; padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; }

    @media (max-width: 1024px) {
      .main-content { grid-template-columns: 1fr; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .search-wrap { max-width: none; }
    }
  `]
})
export class ExpensesComponent implements OnInit, OnDestroy {
  expenses: any[] = [];
  allExpenses: any[] = [];
  searchQuery = '';
  profit: NetProfitResponse | null = null;
  loading = true;
  adding = false;
  showAddForm = false;
  currentMonthLabel = '';
  totalExpenses = 0;
  profitMargin = 0;
  breakdown: any[] = [];
  expenseForm: FormGroup;
  filteredCategories$!: Observable<any[]>;
  
  // Default system categories
  systemCategories = [
    { key: 'ELECTRICITY', label: 'Electricity Bill' },
    { key: 'WATER', label: 'Water Bill' },
    { key: 'STAFF', label: 'Staff Salary' },
    { key: 'REPAIR', label: 'Plumbing/Electrical Repair' },
    { key: 'MAINTENANCE', label: 'General Maintenance' },
    { key: 'INTERNET', label: 'Internet/WiFi' },
    { key: 'OTHER', label: 'Miscellaneous' }
  ];

  // Will be populated from existing expenses
  userCategories: any[] = [];

  private maintenanceService = inject(MaintenanceService);
  private roomService = inject(RoomService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  constructor() {
    const today = new Date();
    this.currentMonthLabel = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    this.expenseForm = this.fb.group({
      category: ['', Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      expenseDate: [new Date().toISOString().split('T')[0], Validators.required]
    });

    this.filteredCategories$ = this.expenseForm.get('category')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  private _filter(value: any): any[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : (value?.label?.toLowerCase() || '');
    const allKnown = [...this.systemCategories, ...this.userCategories];
    
    // Remove duplicates by key
    const uniqueKnown = Array.from(new Map(allKnown.map(item => [item.key, item])).values());
    
    const filtered = uniqueKnown.filter(option => 
      option.label.toLowerCase().includes(filterValue) || 
      option.key.toLowerCase().includes(filterValue)
    );

    // If typing something new, add an "Add New" option
    if (filterValue && !uniqueKnown.some(o => o.label.toLowerCase() === filterValue)) {
      filtered.push({ 
        key: 'NEW_VALUE', 
        label: `Add "${value}" as new category`,
        actualValue: value 
      });
    }

    return filtered;
  }

  displayCategory(option: any): string {
    if (typeof option === 'string') return option;
    if (option?.key === 'NEW_VALUE') return option.actualValue;
    return option ? option.label : '';
  }

  ngOnInit(): void {
    this.loadData();

    // Wire up global refresh button
    this.roomService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.detectChanges();
    const now = new Date().toISOString().split('T')[0];
    
    this.maintenanceService.getNetProfit(now).pipe(takeUntil(this.destroy$)).subscribe(p => {
      this.profit = p;
      this.totalExpenses = p.totalGeneralExpenses + p.totalMaintenanceCost;
      if (p.totalRevenue > 0) {
        this.profitMargin = Math.round((p.netProfit / p.totalRevenue) * 100);
      }
      
      // Load detailed list
      this.maintenanceService.getExpenses(now).pipe(takeUntil(this.destroy$)).subscribe({
        next: (ex) => {
          this.allExpenses = ex;
          this.applyFilter();
          this.harvestCategories(ex);
          this.calculateBreakdown(ex, p.totalMaintenanceCost);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  harvestCategories(ex: any[]): void {
    const seen = new Set(this.systemCategories.map(c => c.key));
    const harvested: any[] = [];
    
    ex.forEach(e => {
      if (!seen.has(e.category)) {
        seen.add(e.category);
        harvested.push({
          key: e.category,
          label: this.formatCategory(e.category)
        });
      }
    });
    this.userCategories = harvested;
  }

  applyFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) {
      this.expenses = [...this.allExpenses];
    } else {
      this.expenses = this.allExpenses.filter(e => 
        e.description.toLowerCase().includes(q) || 
        e.category.toLowerCase().includes(q) ||
        e.amount.toString().includes(q)
      );
    }
    this.cdr.detectChanges();
  }

  calculateBreakdown(ex: any[], maintenanceCost: number): void {
    const totals: any = {};
    const labelMap: any = { 
      'ELECTRICITY': 'Electricity', 'WATER': 'Water', 'REPAIR': 'Repairs', 
      'STAFF': 'Salary', 'MAINTENANCE': 'Maint.', 'INTERNET': 'WiFi', 'OTHER': 'Other' 
    };
    
    // Initialize with system categories to ensure they always have a spot if used
    this.systemCategories.forEach(c => totals[c.key] = 0);
    
    ex.forEach(e => {
      if (!totals[e.category]) totals[e.category] = 0;
      totals[e.category] += e.amount;
    });
    
    // Add ticket costs to Repairs
    totals['REPAIR'] = (totals['REPAIR'] || 0) + maintenanceCost;

    const grandTotal = Object.values(totals).reduce((sum: any, val: any) => sum + val, 0) as number;

    const colors = ['#f59e0b', '#3b82f6', '#ef4444', '#22c55e', '#6366f1', '#a855f7', '#64748b', '#06b6d4', '#ec4899'];

    this.breakdown = Object.keys(totals)
      .filter(key => totals[key] > 0)
      .map((key, index) => ({
        label: labelMap[key] || this.formatCategory(key),
        percentage: grandTotal > 0 ? Math.round((totals[key] / grandTotal) * 100) : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.percentage - a.percentage); // Biggest expenses first
  }

  onAddExpense(): void {
    if (this.expenseForm.invalid) return;
    
    const formValue = this.expenseForm.value;
    let category = formValue.category;
    
    if (typeof category === 'object' && category !== null) {
      if (category.key === 'NEW_VALUE') {
        category = category.actualValue.toUpperCase().replace(/\s+/g, '_');
      } else {
        category = category.key;
      }
    } else {
      // User just typed and didn't select
      category = category.toUpperCase().replace(/\s+/g, '_');
    }

    const payload = {
      ...formValue,
      category: category
    };

    this.adding = true;
    this.maintenanceService.recordExpense(payload).subscribe({
      next: () => {
        this.adding = false;
        this.showAddForm = false;
        this.snackBar.open('Expense recorded!', 'Close', { duration: 3000 });
        this.expenseForm.reset({
          category: '',
          expenseDate: new Date().toISOString().split('T')[0]
        });
        this.loadData();
      },
      error: () => this.adding = false
    });
  }

  getCategoryIcon(cat: string): string {
    switch (cat) {
      case 'ELECTRICITY': return 'bolt';
      case 'WATER': return 'water_drop';
      case 'STAFF': return 'groups';
      case 'REPAIR': return 'build';
      case 'INTERNET': return 'wifi';
      default: return 'category';
    }
  }

  getCategoryColor(cat: string): string {
    switch (cat) {
      case 'ELECTRICITY': return '#f59e0b';
      case 'WATER': return '#3b82f6';
      case 'REPAIR': return '#ef4444';
      case 'STAFF': return '#22c55e';
      default: return '#64748b';
    }
  }

  getCategoryBg(cat: string): string {
    return this.getCategoryColor(cat) + '15';
  }

  formatCategory(cat: string): string {
    const labels: any = { 
      'ELECTRICITY': 'Electricity', 'WATER': 'Water Bill', 'REPAIR': 'Repairs', 
      'STAFF': 'Staff Salary', 'MAINTENANCE': 'General Maintenance', 'INTERNET': 'Internet/WiFi', 'OTHER': 'Miscellaneous' 
    };
    if (labels[cat]) return labels[cat];
    return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }
}
