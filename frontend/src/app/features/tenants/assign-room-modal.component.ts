import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TenantService } from './tenant.service';

@Component({
  selector: 'app-assign-room-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-content animate-in" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-icon"><mat-icon>meeting_room</mat-icon></div>
          <div class="header-text">
            <h2>Assign Room</h2>
            <p>Select a room for <strong>{{ tenant?.fullName }}</strong></p>
          </div>
          <button class="btn-close" (click)="onCancel()"><mat-icon>close</mat-icon></button>
        </div>

        <div class="modal-body">
          <div class="field">
            <label>Available Rooms</label>
            <select [(ngModel)]="selectedRoomId" class="room-select">
              <option [ngValue]="null">Choose a room...</option>
              <option *ngFor="let r of availableRooms" [value]="r.id">Room {{ r.roomNumber }} ({{ r.roomType }}) — ₹{{ r.rentAmount }}</option>
            </select>
          </div>

          <div class="field" *ngIf="selectedRoom">
             <div class="room-preview">
                <div class="prev-item">
                   <label>RENT</label>
                   <span>₹{{ selectedRoom.rentAmount | number }}</span>
                </div>
                <div class="prev-item">
                   <label>CAPACITY</label>
                   <span>{{ selectedRoom.occupancy }}/{{ selectedRoom.maxCapacity }} Filled</span>
                </div>
             </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" (click)="onCancel()">Cancel</button>
          <button class="btn-confirm" 
                  [disabled]="!selectedRoomId || loading" 
                  (click)="onConfirm()">
            <span *ngIf="!loading">Confirm Assignment</span>
            <span *ngIf="loading">Assigning...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px); z-index: 3000;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal-content {
      background: white; width: 100%; max-width: 440px;
      border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);
    }
    .modal-header {
      padding: 24px 24px 20px; display: flex; align-items: flex-start; gap: 16px; position: relative;
    }
    .header-icon {
      width: 44px; height: 44px; background: #eff6ff; color: #3b82f6;
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
    }
    .header-text h2 { margin: 0; font-size: 18px; font-weight: 800; color: #1e293b; }
    .header-text p { margin: 4px 0 0; font-size: 13px; color: #64748b; }
    .btn-close {
      position: absolute; top: 16px; right: 16px; border: none; background: transparent;
      color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 50%;
    }
    .btn-close:hover { background: #f1f5f9; color: #1e293b; }

    .modal-body { padding: 0 24px 24px; }
    .field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .field label { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; }
    .room-select {
      border: 1.5px solid #e2e8f0; padding: 12px; border-radius: 12px;
      font-size: 14px; font-weight: 600; color: #1e293b; outline: none;
      background: #f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E") no-repeat right 12px center;
      background-size: 16px; appearance: none; transition: all 0.2s;
    }
    .room-select:focus { border-color: #3b82f6; background-color: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
    
    .room-preview {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      background: #f1f5f9; padding: 16px; border-radius: 12px;
    }
    .prev-item label { margin-bottom: 4px; color: #64748b; }
    .prev-item span { font-size: 14px; font-weight: 700; color: #1e293b; display: block; }

    .modal-footer {
      padding: 16px 24px 24px; display: flex; gap: 12px; background: #f8fafc;
      border-top: 1px solid #f1f5f9;
    }
    .btn-cancel {
      flex: 1; border: 1.5px solid #e2e8f0; background: white;
      padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 700;
      color: #64748b; cursor: pointer; transition: all 0.2s;
    }
    .btn-cancel:hover { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }
    
    .btn-confirm {
      flex: 1.5; border: none; background: #1e293b;
      padding: 12px; border-radius: 12px; font-size: 14px; font-weight: 700;
      color: white; cursor: pointer; transition: all 0.2s;
    }
    .btn-confirm:hover:not(:disabled) { background: #0f172a; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

    .animate-in { animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `]
})
export class AssignRoomModalComponent implements OnInit {
  @Input() tenant: any;
  @Input() availableRooms: any[] = [];
  @Output() confirm = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<void>();

  selectedRoomId: number | null = null;
  loading = false;

  get selectedRoom() {
    return this.availableRooms.find(r => r.id === this.selectedRoomId);
  }

  ngOnInit(): void { }

  onCancel() { this.cancel.emit(); }
  onConfirm() {
    if (this.selectedRoomId) {
      this.loading = true;
      this.confirm.emit(this.selectedRoomId);
    }
  }
}
