import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TenantService } from '../tenant.service';
import { TenantDetailResponse, TenantRequest, IdProofType } from '../../../shared/models/tenant.models';
import { RoomResponse } from '../../../shared/models/room.models';

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  template: `
  <div class='drawer-overlay' (click)='onClose()'></div>
  <div class='drawer'>
    <div class='drawer-header'>
      <h2>{{ tenant ? 'Edit Tenant' : 'Add New Tenant' }}</h2>
      <button mat-icon-button (click)='onClose()'><mat-icon>close</mat-icon></button>
    </div>

    <form [formGroup]='form' (ngSubmit)='onSubmit()' class='drawer-body'>

      <!-- PERSONAL DETAILS -->
      <p class='section-label'>Personal Details</p>
      <mat-form-field appearance='outline' class='full-width'>
        <mat-label>Full Name</mat-label>
        <input matInput formControlName='fullName' placeholder='e.g. Ravi Kumar'/>
        @if (f['fullName'].touched && f['fullName'].errors?.['required']) {
          <mat-error>Full name is required</mat-error>
        }
      </mat-form-field>

      <div class='row-2'>
        <mat-form-field appearance='outline'>
          <mat-label>Phone</mat-label>
          <input matInput formControlName='phone' placeholder='10-digit number'/>
          @if (f['phone'].touched && f['phone'].errors?.['pattern']) {
            <mat-error>Enter valid 10-digit number</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance='outline'>
          <mat-label>Email</mat-label>
          <input matInput formControlName='email' type='email'/>
          @if (f['email'].touched && f['email'].errors?.['email']) {
            <mat-error>Enter valid email</mat-error>
          }
        </mat-form-field>
      </div>

      <!-- ROOM & RENT -->
      <p class='section-label'>Room &amp; Rent</p>
      <mat-form-field appearance='outline' class='full-width'>
        <mat-label>Assign Room (optional — leave blank for Pending)</mat-label>
        <mat-select formControlName='roomId'>
          <mat-option [value]='null'>-- No Room (Pending) --</mat-option>
          @for (room of availableRooms; track room.id) {
            <mat-option [value]='room.id'>
              Room {{ room.roomNumber }} — {{ room.roomType }} (Cap: {{ room.maxCapacity }})
            </mat-option>
          }
        </mat-select>
      </mat-form-field>

      <div class='row-2'>
        <mat-form-field appearance='outline'>
          <mat-label>Move-in Date</mat-label>
          <input matInput [matDatepicker]='picker' formControlName='moveInDate'/>
          <mat-datepicker-toggle matIconSuffix [for]='picker'></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance='outline'>
          <mat-label>Rent Due Day (1-28)</mat-label>
          <input matInput type='number' formControlName='rentDueDay' min='1' max='28'/>
        </mat-form-field>
      </div>

      <div class='row-2'>
        <mat-form-field appearance='outline'>
          <mat-label>Monthly Rent (₹)</mat-label>
          <input matInput type='number' formControlName='monthlyRent'/>
        </mat-form-field>
        <mat-form-field appearance='outline'>
          <mat-label>Security Deposit (₹)</mat-label>
          <input matInput type='number' formControlName='securityDeposit'/>
        </mat-form-field>
      </div>

      <!-- ID & EMERGENCY -->
      <p class='section-label'>ID &amp; Emergency Contact</p>
      <div class='row-2'>
        <mat-form-field appearance='outline'>
          <mat-label>ID Proof Type</mat-label>
          <mat-select formControlName='idProofType'>
            @for (id of idTypes; track id) {
              <mat-option [value]='id'>{{ id }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance='outline'>
          <mat-label>ID Number</mat-label>
          <input matInput formControlName='idNumber'/>
        </mat-form-field>
      </div>

      <div class='row-2'>
        <mat-form-field appearance='outline'>
          <mat-label>Emergency Contact Name</mat-label>
          <input matInput formControlName='emergencyContact'/>
        </mat-form-field>
        <mat-form-field appearance='outline'>
          <mat-label>Emergency Phone</mat-label>
          <input matInput formControlName='emergencyPhone'/>
        </mat-form-field>
      </div>

      <mat-form-field appearance='outline' class='full-width'>
        <mat-label>Permanent Address</mat-label>
        <textarea matInput formControlName='permanentAddress' rows='2'></textarea>
      </mat-form-field>

      <!-- ACTIONS -->
      <div class='drawer-actions'>
        <button mat-stroked-button type='button' (click)='onClose()'>Cancel</button>
        <button mat-flat-button color='primary' type='submit' [disabled]='saving'>
          @if (saving) { <mat-spinner diameter='20'></mat-spinner> }
          @else { {{ tenant ? 'Update Tenant' : 'Add Tenant' }} }
        </button>
      </div>
    </form>
  </div>
  `,
  styles: [`
    .drawer-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999; }
    .drawer {
      position:fixed;top:0;right:0;height:100vh;width:520px;
      background:#fff;z-index:1000;overflow-y:auto;
      display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,.18);
    }
    .drawer-header {
      display:flex;align-items:center;justify-content:space-between;
      padding:20px 24px;border-bottom:1px solid #e0e0e0;background:#1F3864;
    }
    .drawer-header h2 { margin:0;font-size:18px;font-weight:600;color:#fff; }
    .drawer-header button { color:#fff; }
    .drawer-body { padding:20px 24px;flex:1; }
    .section-label { font-size:13px;font-weight:600;color:#1F3864;
      text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px; }
    .full-width { width:100%;display:block; }
    .row-2 { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    .drawer-actions {
      display:flex;justify-content:flex-end;gap:12px;
      padding-top:16px;margin-top:8px;border-top:1px solid #eee;
    }
    mat-form-field { width:100%;margin-bottom:4px; }
    mat-spinner { display:inline-block; }
  `]
})
export class TenantFormComponent implements OnInit {
  @Input() tenant: TenantDetailResponse | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);

  availableRooms: RoomResponse[] = [];
  saving = false;
  idTypes: IdProofType[] = ['AADHAAR','PAN','PASSPORT','VOTER_ID','DRIVING_LICENSE'];

  form = this.fb.group({
    fullName:         ['', Validators.required],
    phone:            ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    email:            ['', [Validators.required, Validators.email]],
    roomId:           [null as number | null],
    moveInDate:       ['', Validators.required],
    monthlyRent:      [null as number | null, [Validators.required, Validators.min(1)]],
    securityDeposit:  [null as number | null, [Validators.required, Validators.min(0)]],
    rentDueDay:       [1, [Validators.required, Validators.min(1), Validators.max(28)]],
    idProofType:      ['AADHAAR' as IdProofType, Validators.required],
    idNumber:         ['', Validators.required],
    emergencyContact: ['', Validators.required],
    emergencyPhone:   ['', Validators.required],
    permanentAddress: ['', Validators.required],
  });

  get f() { return this.form.controls; }

  ngOnInit() {
    this.tenantService.getAvailableRooms().subscribe(rooms => this.availableRooms = rooms);
    if (this.tenant) {
      this.form.patchValue({
        ...this.tenant,
        moveInDate: this.tenant.moveInDate,
      });
    }
  }

  onSubmit() {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.saving = true;
  const raw = this.form.value;

  const rawDate = raw.moveInDate;
  let formattedDate = '';
  if (rawDate) {
    const d = new Date(rawDate);
    formattedDate = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(rawDate);
  }

  const req: TenantRequest = {
    fullName:         raw.fullName!,
    phone:            raw.phone!,
    email:            raw.email!,
    roomId:           raw.roomId ?? null,
    moveInDate:       formattedDate,
    monthlyRent:      raw.monthlyRent!,
    securityDeposit:  raw.securityDeposit!,
    rentDueDay:       raw.rentDueDay!,
    idProofType:      raw.idProofType!,
    idNumber:         raw.idNumber!,
    emergencyContact: raw.emergencyContact!,
    emergencyPhone:   raw.emergencyPhone!,
    permanentAddress: raw.permanentAddress!,
  };

  const call = this.tenant
    ? this.tenantService.update(this.tenant.id, req)
    : this.tenantService.create(req);

  call.subscribe({
    next: () => { this.saving = false; this.saved.emit(); },
    error: () => { this.saving = false; }
  });
}

  onClose() { this.closed.emit(); }
}

