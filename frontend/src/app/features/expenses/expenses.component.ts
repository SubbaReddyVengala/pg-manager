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
    <div class="expense-page">
      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="search-wrap">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search expenses..." [(ngModel)]="searchQuery" (input)="applyFilter()">
        </div>
        <div class="spacer"></div>
        <button mat-flat-button color="primary" (click)="showAddForm = true">
          <mat-icon>add</mat-icon> Add Expense
        </button>
      </div>

      <!-- SUMMARY CARDS -->
      <div class="stats-grid" *ngIf="profit">
        <div class="stat-card total-income">
          <div class="card-label">TOTAL INCOME</div>
          <div class="card-value">₹{{ profit.totalRevenue | number }}</div>
          <mat-icon class="card-icon">payments</mat-icon>
        </div>
        <div class="stat-card total-expenses">
          <div class="card-label">TOTAL EXPENSES</div>
          <div class="card-value">₹{{ (profit.totalGeneralExpenses + profit.totalMaintenanceCost) | number }}</div>
          <mat-icon class="card-icon">receipt_long</mat-icon>
        </div>
        <div class="stat-card net-profit">
          <div class="card-label">NET PROFIT 🎯</div>
          <div class="card-value profit-text">₹{{ profit.netProfit | number }}</div>
          <div class="profit-margin">{{ profitMargin }}% margin</div>
        </div>
      </div>

      <div class="main-content">
        <!-- EXPENSE LIST -->
        <div class="expense-list-section">
          <h3>{{ currentMonthLabel }} Expenses</h3>
          <div class="loading-center" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          <div class="expense-list" *ngIf="!loading">
            <div class="expense-item" *ngFor="let ex of expenses">
              <div class="ex-icon" [style.background-color]="getCategoryBg(ex.category)">
                <mat-icon [style.color]="getCategoryColor(ex.category)">{{ getCategoryIcon(ex.category) }}</mat-icon>
              </div>
              <div class="ex-details">
                <div class="ex-cat">{{ formatCategory(ex.category) }}</div>
                <div class="ex-date">{{ ex.expenseDate | date:'dd-MMM-yyyy' }}</div>
              </div>
              <div class="ex-amount">₹{{ ex.amount | number }}</div>
            </div>

            <div class="total-row">
              <span>Total Expenses</span>
              <span class="total-val">₹{{ totalExpenses | number }}</span>
            </div>

            <div class="empty-state" *ngIf="expenses.length === 0">
              <app-empty-state
                icon="receipt_long"
                title="No expenses recorded"
                description="You haven't added any expenses for this month yet. Track your costs to accurately see your net profit."
                actionText="Add Expense"
                actionIcon="add"
                padding="40px 20px"
                (actionClicked)="showAddForm = true"
              ></app-empty-state>
            </div>
          </div>
        </div>

        <!-- BREAKDOWN & MARGIN -->
        <div class="side-section">
           <div class="breakdown-card">
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
              </div>
           </div>

           <div class="profit-summary-card" *ngIf="profit">
              <p class="summary-label">NET PROFIT — {{ currentMonthLabel | uppercase }}</p>
              <h2 class="summary-value">₹{{ profit.netProfit | number }}</h2>
              <p class="summary-margin">{{ profitMargin }}% profit margin 🎯</p>
           </div>
        </div>
      </div>

      <!-- ADD EXPENSE OVERLAY -->
      <div class="modal-overlay" *ngIf="showAddForm" (click)="showAddForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Add New Expense</h3>
          <form [formGroup]="expenseForm" (ngSubmit)="onAddExpense()" class="expense-form">
            <mat-form-field appearance="outline">
              <mat-label>Category Name (e.g. Electricity, Tax, etc.)</mat-label>
              <input type="text"
                     placeholder="Select or type category"
                     matInput
                     formControlName="category"
                     [matAutocomplete]="auto">
              <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayCategory">
                <mat-option *ngFor="let option of filteredCategories$ | async" [value]="option">
                  {{option.label}}
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <input matInput formControlName="description" placeholder="e.g. Monthly Electricity Bill">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Amount (₹)</mat-label>
              <input matInput type="number" formControlName="amount">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Expense Date</mat-label>
              <input matInput type="date" formControlName="expenseDate">
            </mat-form-field>

            <div class="modal-actions">
              <button mat-button type="button" (click)="showAddForm = false">Cancel</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="expenseForm.invalid || adding">
                {{ adding ? 'Saving...' : 'Add Expense' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .expense-page { max-width: 1200px; margin: 0 auto; padding: 20px; }
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
    .spacer { flex: 1; }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #fff; border-radius: 12px; padding: 24px; position: relative; border: 1px solid #e2e8f0; }
    .card-label { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 8px; }
    .card-value { font-size: 24px; font-weight: 800; color: #1e293b; }
    .card-icon { position: absolute; top: 20px; right: 20px; color: #f59e0b; opacity: 0.8; }
    .total-income { border-top: 4px solid #22c55e; }
    .total-expenses { border-top: 4px solid #ef4444; }
    .net-profit { border-top: 4px solid #a855f7; }
    .profit-text { color: #22c55e; }
    .profit-margin { font-size: 12px; color: #22c55e; font-weight: 600; margin-top: 4px; }

    .main-content { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    .expense-list-section { background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; }
    .expense-list-section h3 { margin: 0 0 20px; font-size: 16px; font-weight: 700; }
    .expense-item { display: flex; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    .ex-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .ex-details { flex: 1; }
    .ex-cat { font-size: 14px; font-weight: 600; color: #1e293b; }
    .ex-date { font-size: 12px; color: #94a3b8; }
    .ex-amount { font-size: 16px; font-weight: 700; color: #ef4444; }

    .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 2px solid #f1f5f9; font-weight: 700; }
    .total-val { font-size: 20px; color: #ef4444; }

    .side-section { display: flex; flex-direction: column; gap: 24px; }
    .breakdown-card { background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; }
    .breakdown-card h3 { margin: 0 0 20px; font-size: 16px; font-weight: 700; }
    .breakdown-list { display: flex; flex-direction: column; gap: 16px; }
    .br-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .br-label { font-size: 13px; color: #64748b; }
    .br-pct { font-size: 13px; font-weight: 700; color: #1e293b; }
    .br-bar { width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .br-fill { height: 100%; border-radius: 4px; }

    .profit-summary-card { background: #22c55e; border-radius: 12px; padding: 24px; color: #fff; text-align: center; }
    .summary-label { font-size: 11px; font-weight: 700; opacity: 0.9; margin-bottom: 12px; }
    .summary-value { font-size: 32px; font-weight: 800; margin: 0; }
    .summary-margin { font-size: 13px; font-weight: 600; opacity: 0.9; margin-top: 8px; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
    .modal { background: #fff; border-radius: 12px; padding: 28px; width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
    .modal h3 { margin: 0 0 20px; color: #1e293b; }
    .expense-form { display: flex; flex-direction: column; gap: 4px; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
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
