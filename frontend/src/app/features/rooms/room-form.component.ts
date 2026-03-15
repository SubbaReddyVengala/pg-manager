import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RoomResponse, RoomRequest } from '../../shared/models/room.models';
import { RoomService } from '../../core/services/room.service';

@Component({
  selector: 'app-room-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="drawer-overlay" (click)="onCancel()"></div>
    <div class="drawer">
      <div class="drawer-header">
        <div>
          <h2>{{ isEdit ? "Edit Room" : "Add New Room" }}</h2>
          <p>{{ isEdit ? "Update room details" : "Fill in room information" }}</p>
        </div>
        <button class="close-btn" (click)="onCancel()"><mat-icon>close</mat-icon></button>
      </div>
      <div class="error-alert" *ngIf="errorMessage">
        <mat-icon>error_outline</mat-icon><span>{{ errorMessage }}</span>
      </div>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="drawer-form">
        <p class="section-label">ROOM INFO</p>
        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Room Number *</mat-label>
            <input matInput formControlName="roomNumber" placeholder="e.g. 101">
            <mat-error *ngIf="f['roomNumber'].hasError('required')">Required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Floor *</mat-label>
            <input matInput formControlName="floor" type="number" placeholder="1">
            <mat-error *ngIf="f['floor'].hasError('required')">Required</mat-error>
            <mat-error *ngIf="f['floor'].hasError('min')">Min floor is 1</mat-error>
          </mat-form-field>
        </div>
        <div class="row-2">
          <mat-form-field appearance="outline">
            <mat-label>Room Type *</mat-label>
            <mat-select formControlName="roomType">
              <mat-option value="SINGLE">SINGLE</mat-option>
              <mat-option value="DOUBLE">DOUBLE</mat-option>
              <mat-option value="TRIPLE">TRIPLE</mat-option>
            </mat-select>
            <mat-error *ngIf="f['roomType'].hasError('required')">Required</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Max Capacity *</mat-label>
            <input matInput formControlName="maxCapacity" type="number" placeholder="1">
            <mat-error *ngIf="f['maxCapacity'].hasError('required')">Required</mat-error>
            <mat-error *ngIf="f['maxCapacity'].hasError('min')">Min 1</mat-error>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Monthly Rent (₹) *</mat-label>
          <input matInput formControlName="rentAmount" type="number" placeholder="6500">
          <mat-error *ngIf="f['rentAmount'].hasError('required')">Required</mat-error>
          <mat-error *ngIf="f['rentAmount'].hasError('min')">Must be greater than 0</mat-error>
        </mat-form-field>
        <p class="section-label" style="margin-top:8px">AMENITIES (OPTIONAL)</p>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Amenities</mat-label>
          <input matInput formControlName="amenities" placeholder="e.g. AC, WiFi, Geyser, TV">
          <mat-hint>Comma separated list</mat-hint>
        </mat-form-field>
        <p class="section-label" style="margin-top:8px">INITIAL STATUS *</p>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="AVAILABLE">AVAILABLE</mat-option>
            <mat-option value="OCCUPIED">OCCUPIED</mat-option>
            <mat-option value="MAINTENANCE">MAINTENANCE</mat-option>
          </mat-select>
          <mat-error *ngIf="f['status'].hasError('required')">Required</mat-error>
        </mat-form-field>
        <div class="drawer-footer">
          <button mat-stroked-button type="button" (click)="onCancel()">Cancel</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="loading">
            <mat-spinner diameter="18" *ngIf="loading"></mat-spinner>
            <span *ngIf="!loading">{{ isEdit ? "Save Changes" : "Create Room" }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .drawer-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:999; }
    .drawer {
      position:fixed; top:0; right:0; width:420px; height:100vh;
      background:#fff; box-shadow:-4px 0 24px rgba(0,0,0,0.15);
      z-index:1000; display:flex; flex-direction:column;
      overflow-y:auto; animation:slideIn 0.25s ease;
    }
    @keyframes slideIn { from { transform:translateX(100%); } to { transform:translateX(0); } }
    .drawer-header { display:flex; justify-content:space-between; align-items:flex-start;
      padding:24px 24px 16px; border-bottom:1px solid #E5E7EB; flex-shrink:0; }
    .drawer-header h2 { margin:0; font-size:18px; font-weight:700; color:#111827; }
    .drawer-header p  { margin:4px 0 0; font-size:13px; color:#6B7280; }
    .close-btn { background:none; border:none; cursor:pointer; color:#6B7280;
      padding:4px; border-radius:6px; display:flex; align-items:center; transition:background 0.18s; }
    .close-btn:hover { background:#F3F4F6; color:#111827; }
    .error-alert { display:flex; align-items:center; gap:8px; background:#FDEDEC;
      border:1px solid #E74C3C; border-radius:8px; padding:12px 16px;
      color:#C0392B; font-size:13px; margin:16px 24px 0; }
    .drawer-form { padding:20px 24px; display:flex; flex-direction:column; gap:4px; flex:1; }
    .section-label { font-size:11px; font-weight:700; color:#6B7280; letter-spacing:0.8px; margin:0 0 8px; }
    .row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .full  { width:100%; }
    .drawer-footer { display:flex; justify-content:flex-end; gap:12px; margin-top:auto; padding-top:24px; }
    @media (max-width:480px) { .drawer { width:100%; } .row-2 { grid-template-columns:1fr; } }
  `]
})
export class RoomFormComponent implements OnInit {
  @Input()  room:      RoomResponse | null = null;
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  form!: FormGroup;
  loading = false; errorMessage = "";
  get isEdit(): boolean { return this.room !== null; }
  get f() { return this.form.controls; }
  constructor(private fb: FormBuilder, private roomService: RoomService, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    this.form = this.fb.group({
      roomNumber:  [this.room?.roomNumber  ?? '', Validators.required],
      floor:       [this.room?.floor       ?? 1,  [Validators.required, Validators.min(1)]],
      roomType:    [this.room?.roomType    ?? '', Validators.required],
      maxCapacity: [this.room?.maxCapacity ?? 1,  [Validators.required, Validators.min(1)]],
      rentAmount:  [this.room?.rentAmount  ?? '', [Validators.required, Validators.min(1)]],
      amenities:   [this.room?.amenities   ?? ''],
      status:      [this.room?.status      ?? 'AVAILABLE', Validators.required],
    });
  }
  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading = true; this.errorMessage = '';
    const request: RoomRequest = this.form.value;
    const call = this.isEdit ? this.roomService.update(this.room!.id, request) : this.roomService.create(request);
    call.subscribe({
      next: () => this.saved.emit(),
      error: (err) => {
        this.errorMessage = err.error?.message ?? 'Failed to save room.';
        this.loading = false; this.cdr.detectChanges();
      }
    });
  }
  onCancel(): void { this.cancelled.emit(); }
}

