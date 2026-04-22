import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MaintenanceService, MaintenanceTicket, MaintenanceStats, NetProfitResponse } from '../../core/services/maintenance.service';
import { MaintenanceFormComponent } from './components/maintenance-form.component';
import { RoomService } from '../../core/services/room.service';
import { InputDialogComponent } from '../../shared/components/input-dialog/input-dialog.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MaintenanceFormComponent, InputDialogComponent],
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  tickets: MaintenanceTicket[] = [];
  filteredTickets: MaintenanceTicket[] = [];
  stats: MaintenanceStats = { openCount: 0, inProgressCount: 0, resolvedCount: 0, avgResolutionTime: '0d' };
  profit: NetProfitResponse | null = null;
  activeTab = 'ALL';
  currentMonth = new Date().toISOString().substring(0, 7);
  showForm = false;
  formType: 'TICKET' | 'EXPENSE' = 'TICKET';

  showCostDialog = false;
  resolvingTicketId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private maintenanceService: MaintenanceService,
    private roomService: RoomService,
    private cdr: ChangeDetectorRef
  ) {
    // Robust month initialization (yyyy-MM)
    const now = new Date();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    this.currentMonth = `${now.getFullYear()}-${month}`;
  }

  ngOnInit(): void {
    this.loadData();

    // Subscribe to global Refresh button
    this.roomService.refresh$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loadTickets();
    this.loadStats();
    this.loadProfit();
  }

  loadTickets(): void {
    const status = this.activeTab === 'ALL' ? undefined : this.activeTab;
    this.maintenanceService.getTickets(status).subscribe({
      next: (data: MaintenanceTicket[]) => {
        this.tickets = data;
        this.filteredTickets = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading tickets', err)
    });
  }

  loadStats(): void {
    this.maintenanceService.getStats().subscribe({
      next: (data: MaintenanceStats) => {
        this.stats = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading stats', err)
    });
  }

  loadProfit(): void {
    // API expects full date yyyy-MM-dd, so append -01
    const queryMonth = this.currentMonth + "-01";
    this.maintenanceService.getNetProfit(queryMonth).subscribe({
      next: (data: NetProfitResponse) => {
        this.profit = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading profit', err);
        this.profit = null;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.loadTickets();
  }

  startWork(id: number): void {
    this.maintenanceService.startWork(id).subscribe(() => {
      this.maintenanceService.triggerRefresh();
      this.loadData();
    });
  }

  resolveWork(id: number): void {
    this.resolvingTicketId = id;
    this.showCostDialog = true;
    this.cdr.detectChanges();
  }

  executeResolve(cost: any): void {
    if (this.resolvingTicketId !== null) {
      const finalCost = parseFloat(cost) || 0;
      this.maintenanceService.resolveTicket(this.resolvingTicketId, finalCost).subscribe(() => {
        this.showCostDialog = false;
        this.resolvingTicketId = null;
        this.maintenanceService.triggerRefresh();
        this.loadData();
      });
    }
  }

  onSearch(event: any): void {
    const term = event.target.value.toLowerCase();
    this.filteredTickets = this.tickets.filter(t => 
      (t.description?.toLowerCase().includes(term)) || 
      (t.tenantName?.toLowerCase().includes(term)) ||
      (t.roomNumber?.toLowerCase().includes(term))
    );
  }

  getTicketIcon(description: string): string {
    const d = description?.toLowerCase() || '';
    if (d.includes('ac') || d.includes('cool')) return 'ac_unit';
    if (d.includes('tap') || d.includes('leak') || d.includes('water') || d.includes('plumb')) return 'water_drop';
    if (d.includes('light') || d.includes('bulb') || d.includes('electric')) return 'lightbulb';
    if (d.includes('power') || d.includes('socket')) return 'power';
    if (d.includes('wifi') || d.includes('internet')) return 'wifi';
    return 'build';
  }

  getTicketIconColor(description: string): string {
    const d = description?.toLowerCase() || '';
    if (d.includes('ac')) return '#3b82f6';
    if (d.includes('tap') || d.includes('leak')) return '#0ea5e9';
    if (d.includes('light') || d.includes('bulb')) return '#f59e0b';
    if (d.includes('power')) return '#64748b';
    return '#6366f1';
  }

  openForm(type: 'TICKET' | 'EXPENSE'): void {
    this.formType = type;
    this.showForm = true;
  }

  onSaved(): void {
    this.showForm = false;
    this.loadData();
  }

  onCancelled(): void {
    this.showForm = false;
  }
}
