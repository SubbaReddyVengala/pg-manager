import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { RoomService } from '../../../core/services/room.service';
import { RoomResponse } from '../../../shared/models/room.models';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-maintenance-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ type === 'TICKET' ? 'Raise Maintenance Ticket' : 'Record General Expense' }}</h2>
          <button class="close-btn" (click)="onCancel()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-body">
            
            <!-- TICKET FIELDS -->
            <ng-container *ngIf="type === 'TICKET'">
              <div class="form-group">
                <label>Select Room *</label>
                <select formControlName="roomNumber" 
                       [class.invalid]="form.get('roomNumber')?.invalid && form.get('roomNumber')?.touched">
                  <option value="" disabled selected>Choose Room...</option>
                  <option *ngFor="let room of rooms" [value]="room.roomNumber">
                    Room {{ room.roomNumber }} ({{ room.status }})
                  </option>
                </select>
                <span class="error-text" *ngIf="form.get('roomNumber')?.invalid && form.get('roomNumber')?.touched">Room is required</span>
              </div>
              <div class="form-group">
                <label>Tenant Name (Optional)</label>
                <input type="text" formControlName="tenantName" placeholder="e.g. Suresh Kumar">
              </div>
              <div class="form-group">
                <label>Priority *</label>
                <select formControlName="priority">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </ng-container>

            <!-- EXPENSE FIELDS -->
            <ng-container *ngIf="type === 'EXPENSE'">
              <div class="form-group">
                <label>Category *</label>
                <select formControlName="category">
                  <option value="ELECTRICITY">Electricity</option>
                  <option value="WATER">Water</option>
                  <option value="STAFF">Staff Salary</option>
                  <option value="RENT">Building Rent</option>
                  <option value="REPAIR">Repair</option>
                  <option value="INTERNET">Internet</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Amount (₹) *</label>
                <input type="number" formControlName="amount" placeholder="0.00"
                       [class.invalid]="form.get('amount')?.invalid && form.get('amount')?.touched">
                <span class="error-text" *ngIf="form.get('amount')?.invalid && form.get('amount')?.touched">Amount > 0 required</span>
              </div>
              <div class="form-group">
                <label>Expense Date *</label>
                <input type="date" formControlName="expenseDate"
                       [class.invalid]="form.get('expenseDate')?.invalid && form.get('expenseDate')?.touched">
              </div>
            </ng-container>

            <!-- COMMON FIELD -->
            <div class="form-group">
              <label>Description / Note *</label>
              <textarea formControlName="description" rows="3" placeholder="Details..."
                        [class.invalid]="form.get('description')?.invalid && form.get('description')?.touched"></textarea>
              <span class="error-text" *ngIf="form.get('description')?.invalid && form.get('description')?.touched">Required</span>
            </div>

          </div>

          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="onCancel()">Cancel</button>
            <button type="submit" class="btn-primary" [disabled]="form.invalid || loading">
              {{ loading ? 'Saving...' : 'Save Details' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
      backdrop-filter: blur(2px);
    }
    .modal-card {
      background: white; width: 100%; max-width: 450px; border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden;
    }
    .modal-header {
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0;
      display: flex; justify-content: space-between; align-items: center;
      h2 { font-size: 1.125rem; font-weight: 700; color: #1e293b; margin: 0; }
      .close-btn { background: none; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer; }
    }
    .form-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-group {
      display: flex; flex-direction: column; gap: 0.375rem;
      label { font-size: 0.875rem; font-weight: 600; color: #475569; }
      input, select, textarea {
        padding: 0.625rem; border: 1px solid #cbd5e1; border-radius: 0.5rem;
        font-size: 0.875rem; outline: none; transition: all 0.2s;
        &:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
        &.invalid { border-color: #ef4444; background: #fffafb; }
      }
    }
    .error-text { color: #ef4444; font-size: 0.75rem; font-weight: 600; }
    .modal-footer {
      padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0;
      display: flex; justify-content: flex-end; gap: 0.75rem;
    }
    .btn-secondary { padding: 0.5rem 1rem; border: 1px solid #cbd5e1; background: white; border-radius: 0.5rem; cursor: pointer; }
    .btn-primary { 
      padding: 0.5rem 1.5rem; background: #1e293b; color: white; border: none; 
      border-radius: 0.5rem; cursor: pointer; transition: all 0.2s;
      &:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; }
      &:hover:not(:disabled) { background: #334155; }
    }
  `]
})
export class MaintenanceFormComponent implements OnInit {
  @Input() type: 'TICKET' | 'EXPENSE' = 'TICKET';
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  rooms: RoomResponse[] = [];

  private roomService = inject(RoomService);

  constructor(
    private fb: FormBuilder, 
    private maintenanceService: MaintenanceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.type === 'TICKET') {
      this.form = this.fb.group({
        roomNumber: ['', Validators.required],
        tenantName: [''],
        priority: ['MEDIUM', Validators.required],
        description: ['', Validators.required]
      });
      this.loadRooms();
    } else {
      this.form = this.fb.group({
        category: ['ELECTRICITY', Validators.required],
        amount: ['', [Validators.required, Validators.min(1)]],
        expenseDate: [new Date().toISOString().split('T')[0], Validators.required],
        description: ['', Validators.required]
      });
    }
  }

  loadRooms(): void {
    this.roomService.getRooms().subscribe({
      next: (data: RoomResponse[]) => {
        this.rooms = data.sort((a: RoomResponse, b: RoomResponse) => a.roomNumber.localeCompare(b.roomNumber));
      },
      error: () => this.snackBar.open('Error loading rooms.', 'Close', { duration: 3000 })
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const obs: Observable<any> = this.type === 'TICKET' 
      ? this.maintenanceService.raiseTicket(this.form.value)
      : this.maintenanceService.recordExpense(this.form.value);

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err.error?.message || 'Failed to save';
        this.snackBar.open('Error: ' + msg, 'Close', { duration: 5000 });
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
