import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PaymentService } from '../payment.service';
import { PaymentRequest, PaymentMode } from '../../../shared/models/payment.models';
import { TenantResponse } from '../../../shared/models/tenant.models';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatCheckboxModule
  ],
  template: `
  <div class='drawer-overlay' (click)='onClose()'></div>
  <div class='drawer'>
    <div class='drawer-header'>
      <h2>Record Payment</h2>
      <button mat-icon-button (click)='onClose()'><mat-icon>close</mat-icon></button>
    </div>

    <form [formGroup]='form' (ngSubmit)='onSubmit()' class='drawer-body'>

      <!-- TENANT & MONTH -->
      <p class='section-label'>Tenant &amp; Month</p>
      <mat-form-field appearance='outline' class='full-width'>
        <mat-label>Select Tenant</mat-label>
        <mat-select formControlName='tenantId' (selectionChange)='onTenantChange($event.value)'>
          @for (t of tenants; track t.id) {
            <mat-option [value]='t.id'>
              {{ t.fullName }} — Room {{ t.roomNumber }}
            </mat-option>
          }
        </mat-select>
        @if (f['tenantId'].touched && f['tenantId'].errors?.['required']) {
          <mat-error>Tenant is required</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance='outline' class='full-width'>
        <mat-label>Payment Month</mat-label>
        <input matInput [matDatepicker]='monthPicker'
               formControlName='rentMonth'
               placeholder='Select month'/>
        <mat-datepicker-toggle matIconSuffix [for]='monthPicker'></mat-datepicker-toggle>
        <mat-datepicker #monthPicker startView='year'
          (monthSelected)='onMonthSelected($event, monthPicker)'></mat-datepicker>
      </mat-form-field>

      <!-- PAYMENT DETAILS -->
      <p class='section-label'>Payment Details</p>
      <div class='row-2'>
        <mat-form-field appearance='outline'>
          <mat-label>Rent Amount (₹)</mat-label>
          <input matInput formControlName='rentAmount' readonly/>
        </mat-form-field>
        <mat-form-field appearance='outline'>
          <mat-label>Amount Paid (₹)</mat-label>
          <input matInput type='number' formControlName='amountPaid'/>
          @if (f['amountPaid'].touched && f['amountPaid'].errors?.['required']) {
            <mat-error>Amount is required</mat-error>
          }
        </mat-form-field>
      </div>

      <div class='row-2'>
        <mat-form-field appearance='outline'>
          <mat-label>Payment Date</mat-label>
          <input matInput [matDatepicker]='datePicker' formControlName='paymentDate'/>
          <mat-datepicker-toggle matIconSuffix [for]='datePicker'></mat-datepicker-toggle>
          <mat-datepicker #datePicker></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance='outline'>
          <mat-label>Payment Mode</mat-label>
          <mat-select formControlName='paymentMode'>
            @for (mode of paymentModes; track mode) {
              <mat-option [value]='mode'>{{ mode }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      <mat-form-field appearance='outline' class='full-width'>
        <mat-label>Transaction ID / Cheque No. (optional)</mat-label>
        <input matInput formControlName='transactionId'
               placeholder='Optional reference'/>
      </mat-form-field>

      <mat-form-field appearance='outline' class='full-width'>
        <mat-label>Note (optional)</mat-label>
        <textarea matInput formControlName='note' rows='2'
                  placeholder='Optional note'></textarea>
      </mat-form-field>

      <!-- RECEIPT NOTE -->
      <div class='receipt-note'>
        <mat-icon>check_circle</mat-icon>
        After saving — PDF receipt will be auto-generated
      </div>

      <!-- ACTIONS -->
      <div class='drawer-actions'>
        <button mat-stroked-button type='button' (click)='onClose()'>Cancel</button>
        <button mat-flat-button color='primary' type='submit' [disabled]='saving'>
          @if (saving) {
            <mat-spinner diameter='20'></mat-spinner>
          } @else {
  <ng-container>
    <mat-icon>save</mat-icon> Save Payment
  </ng-container>
}
        </button>
      </div>
    </form>
  </div>
  `,
  styles: [`
    .drawer-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999; }
    .drawer {
      position:fixed;top:0;right:0;height:100vh;width:500px;
      background:#fff;z-index:1000;overflow-y:auto;
      display:flex;flex-direction:column;
      box-shadow:-4px 0 24px rgba(0,0,0,.18);
    }
    .drawer-header {
      display:flex;align-items:center;justify-content:space-between;
      padding:20px 24px;border-bottom:1px solid #e0e0e0;
      background:#1F3864;
    }
    .drawer-header h2 { margin:0;font-size:18px;font-weight:600;color:#fff; }
    .drawer-header button { color:#fff; }
    .drawer-body { padding:20px 24px;flex:1; }
    .section-label {
      font-size:12px;font-weight:600;color:#1F3864;
      text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px;
    }
    .full-width { width:100%;display:block; }
    .row-2 { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
    mat-form-field { width:100%;margin-bottom:4px; }
    .receipt-note {
      display:flex;align-items:center;gap:8px;
      background:#E8F5E9;border-radius:8px;padding:10px 14px;
      font-size:13px;color:#2E7D32;margin:12px 0;
    }
    .receipt-note mat-icon { font-size:18px;width:18px;height:18px;color:#2E7D32; }
    .drawer-actions {
      display:flex;justify-content:flex-end;gap:12px;
      padding-top:16px;margin-top:8px;border-top:1px solid #eee;
    }
    mat-spinner { display:inline-block; }
  `]
})
export class PaymentFormComponent implements OnInit {
  @Output() saved  = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private fb             = inject(FormBuilder);
  private paymentService = inject(PaymentService);

  tenants:      TenantResponse[] = [];
  saving      = false;
  paymentModes: PaymentMode[] = ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE'];

  form = this.fb.group({
    tenantId:      [null as number | null, Validators.required],
    rentMonth:     ['', Validators.required],
    rentAmount:    [{ value: '', disabled: true }],
    amountPaid:    [null as number | null, [Validators.required, Validators.min(1)]],
    paymentDate:   ['', Validators.required],
    paymentMode:   ['CASH' as PaymentMode, Validators.required],
    transactionId: [''],
    note:          [''],
  });

  get f() { return this.form.controls; }

  ngOnInit() {
    this.paymentService.getActiveTenants().subscribe((t: TenantResponse[]) => this.tenants = t);
    // Default payment date to today
    const today = new Date().toISOString().split('T')[0];
    this.form.patchValue({ paymentDate: today });
  }

  onTenantChange(tenantId: number) {
    const tenant = this.tenants.find(t => t.id === tenantId);
    if (tenant) {
      this.form.patchValue({ rentAmount: tenant.monthlyRent as any });
    }
  }

  onMonthSelected(date: Date, picker: any) {
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    this.form.patchValue({ rentMonth: firstOfMonth.toISOString().split('T')[0] });
    picker.close();
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const raw = this.form.getRawValue();
    const req: PaymentRequest = {
      tenantId:      raw.tenantId!,
      rentMonth: raw.rentMonth
  ? new Date(raw.rentMonth as any).toISOString().split('T')[0]
  : '',
      amountPaid:    raw.amountPaid!,
      paymentDate: raw.paymentDate
  ? new Date(raw.paymentDate as any).toISOString().split('T')[0]
  : '',
      paymentMode:   raw.paymentMode!,
      transactionId: raw.transactionId || null,
      note:          raw.note || null,
    };
    this.paymentService.record(req).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: (err) => {
        this.saving = false;
        alert(err.error?.message || 'Failed to record payment');
      }
    });
  }

  onClose() { this.closed.emit(); }
}
