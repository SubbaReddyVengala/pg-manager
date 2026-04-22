import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state-container" [style.padding]="padding">
      <div class="top-content">
        <img *ngIf="topImage" [src]="topImage" class="top-img" (error)="topImage = null">
        <div *ngIf="!topImage" class="icon-circle" [style.background-color]="iconBgColor">
          <mat-icon [style.color]="iconColor">{{ icon }}</mat-icon>
        </div>
      </div>
      <h3 class="title">{{ title }}</h3>
      <p class="description">{{ description }}</p>
      <button *ngIf="actionText" mat-flat-button color="primary" class="action-btn" (click)="onAction()">
        <mat-icon *ngIf="actionIcon" style="margin-right: 8px;">{{ actionIcon }}</mat-icon>
        {{ actionText }}
      </button>
    </div>
  `,
  styles: [`
    .empty-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      width: 100%;
    }
    .top-content {
      margin-bottom: 24px;
    }
    .top-img {
      width: 100px;
      height: 100px;
      object-fit: contain;
    }
    .icon-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-circle mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .description {
      font-size: 14px;
      color: #94a3b8;
      max-width: 400px;
      margin: 0 0 24px 0;
      line-height: 1.6;
      font-weight: 500;
    }
    .action-btn {
      border-radius: 10px;
      font-weight: 700;
      height: 44px;
      background: #1e293b !important;
      padding: 0 24px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = 'search_off';
  @Input() iconColor = '#94a3b8';
  @Input() iconBgColor = '#f1f5f9';
  @Input() topImage: string | null = null;
  @Input() title = 'No results found';
  @Input() description = 'Try adjusting your filters or search terms to find what you are looking for.';
  @Input() actionText = '';
  @Input() actionIcon = '';
  @Input() padding = '80px 20px';

  @Output() actionClicked = new EventEmitter<void>();

  onAction() {
    this.actionClicked.emit();
  }
}
