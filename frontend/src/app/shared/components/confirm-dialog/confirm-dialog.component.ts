import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        
        <div class="modal-top">
           <img *ngIf="imageIcon" [src]="imageIcon" class="top-img" (error)="imageIcon = null">
           <div *ngIf="!imageIcon" class="icon-wrap" [class]="type">
             <mat-icon>{{ icon }}</mat-icon>
           </div>
        </div>

        <div class="modal-content">
          <h3>{{ title }}</h3>
          <p class="message">{{ message }}</p>
        </div>
        
        <div class="modal-footer">
          <button mat-button class="btn-cancel" (click)="onCancel()">{{ cancelText }}</button>
          <button mat-flat-button class="btn-confirm" [class]="type" (click)="onConfirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() type: 'danger' | 'warning' | 'info' | 'success' = 'warning';
  @Input() imageIcon: string | null = null; // To support 3D-like icons from reference
  
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get icon(): string {
    if (this.imageIcon) return '';
    switch (this.type) {
      case 'danger': return 'delete_outline';
      case 'warning': return 'help_outline';
      case 'info': return 'info_outline';
      case 'success': return 'check_circle_outline';
      default: return 'help_outline';
    }
  }

  get color(): string {
    switch (this.type) {
      case 'danger': return 'warn';
      case 'warning': return 'primary'; // Slate 800
      case 'info': return 'accent';
      default: return 'primary';
    }
  }

  onConfirm(): void { this.confirm.emit(); }
  onCancel(): void { this.cancel.emit(); }
}
