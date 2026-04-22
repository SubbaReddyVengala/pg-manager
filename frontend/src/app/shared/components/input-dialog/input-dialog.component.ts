import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-input-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        
        <div class="modal-top">
           <div class="icon-wrap info">
             <mat-icon>{{ icon }}</mat-icon>
           </div>
        </div>

        <div class="modal-content">
          <h3>{{ title }}</h3>
          <p class="message">{{ message }}</p>
          
          <div class="input-container">
            <span class="currency" *ngIf="isCurrency">₹</span>
            <input 
              [type]="inputType" 
              [(ngModel)]="inputValue" 
              [placeholder]="placeholder"
              (keyup.enter)="onConfirm()"
              autofocus
            >
          </div>
        </div>
        
        <div class="modal-footer">
          <button mat-button class="btn-cancel" (click)="onCancel()">{{ cancelText }}</button>
          <button mat-flat-button class="btn-confirm" (click)="onConfirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.4); 
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-card {
      width: 100%;
      max-width: 380px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      text-align: center;
      padding: 32px;
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-top {
      margin-bottom: 24px;
      display: flex;
      justify-content: center;

      .icon-wrap {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
        }

        &.info { background: #eff6ff; color: #3b82f6; }
      }
    }

    .modal-content {
      margin-bottom: 32px;

      h3 {
        margin: 0 0 12px;
        font-size: 20px;
        font-weight: 800;
        color: #1e293b;
        letter-spacing: -0.5px;
      }

      .message {
        margin: 0 0 24px;
        font-size: 14px;
        line-height: 1.6;
        color: #64748b;
        font-weight: 500;
        padding: 0 10px;
      }
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 0 16px;
      height: 52px;
      transition: all 0.2s;

      &:focus-within {
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
      }

      .currency {
        font-weight: 700;
        color: #1e293b;
        margin-right: 8px;
        font-size: 16px;
      }

      input {
        border: none;
        outline: none;
        background: transparent;
        width: 100%;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;

        &::placeholder { color: #94a3b8; }
      }
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      
      button {
        flex: 1;
        height: 48px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 14px;
        text-transform: none;
      }

      .btn-cancel {
        background: #f1f5f9 !important;
        color: #475569 !important;
      }

      .btn-confirm {
        background: #1e293b !important;
        color: white !important;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(20px) scale(0.95); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
  `]
})
export class InputDialogComponent {
  @Input() title = 'Enter Value';
  @Input() message = 'Please provide the details below.';
  @Input() placeholder = '';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() icon = 'edit';
  @Input() inputType = 'text';
  @Input() inputValue: any = '';
  @Input() isCurrency = false;

  @Output() confirm = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit(this.inputValue);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
