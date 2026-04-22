import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Auth routes  —  no guard
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes')
      .then(m => m.authRoutes),
  },

  // Dashboard  —  protected by authGuard
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    children: [
      { 
        path: '', 
        loadComponent: () => import('./features/dashboard/home/home.component').then(m => m.HomeComponent),
        data: { title: 'Dashboard', subtitle: 'Live Overview' }
      },
      { 
        path: 'rooms', 
        loadComponent: () => import('./features/rooms/rooms.component').then(m => m.RoomsComponent),
        data: { title: 'Room Management', subtitle: 'Manage all rooms in your PG' }
      },
      { 
        path: 'tenants', 
        loadComponent: () => import('./features/tenants/tenants.component').then(m => m.TenantsComponent),
        data: { title: 'Tenant Management', subtitle: 'Active Tenant Profiles' }
      },
      { 
        path: 'tenants/:id', 
        loadComponent: () => import('./features/tenants/tenant-detail/tenant-detail.component').then(m => m.TenantDetailComponent),
        data: { title: 'Tenant Details', subtitle: 'Detailed Profile' }
      },
      { 
        path: 'payments', 
        loadComponent: () => import('./features/payments/payments.component').then(m => m.PaymentsComponent),
        data: { title: 'Payment Management', subtitle: 'Rent Collection Cycle' }
      },
      { 
        path: 'maintenance', 
        loadComponent: () => import('./features/maintenance/maintenance.component').then(m => m.MaintenanceComponent),
        data: { title: 'Maintenance Tracker', subtitle: 'Tickets & Repairs' }
      },
      { 
        path: 'expenses', 
        loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent),
        data: { title: 'Expense Management', subtitle: 'General PG Expenses' }
      },
      { 
        path: 'reports', 
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        data: { title: 'Reports & Analytics', subtitle: 'Business Performance' }
      },
      { 
        path: 'settings', 
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        data: { title: 'Settings', subtitle: 'System Configuration' }
      },
      { 
        path: 'notifications', 
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        data: { title: 'Notifications', subtitle: 'Alerts & Messages' }
      }
    ]
  },

  { path: '**', redirectTo: '/dashboard' },
];
