import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard } from './core/guards/role.guard';

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
        canActivate: [roleGuard],
        data: { title: 'Dashboard', subtitle: 'Live Overview', roles: ['OWNER', 'STAFF'] }
      },
      { 
        path: 'rooms', 
        loadComponent: () => import('./features/rooms/rooms.component').then(m => m.RoomsComponent),
        canActivate: [roleGuard],
        data: { title: 'Room Management', subtitle: 'Manage all rooms in your PG', roles: ['OWNER', 'STAFF'] }
      },
      { 
        path: 'tenants', 
        loadComponent: () => import('./features/tenants/tenants.component').then(m => m.TenantsComponent),
        canActivate: [roleGuard],
        data: { title: 'Tenant Management', subtitle: 'Active Tenant Profiles', roles: ['OWNER', 'STAFF'] }
      },
      { 
        path: 'tenants/:id', 
        loadComponent: () => import('./features/tenants/tenant-detail/tenant-detail.component').then(m => m.TenantDetailComponent),
        canActivate: [roleGuard],
        data: { title: 'Tenant Details', subtitle: 'Detailed Profile', roles: ['OWNER', 'STAFF'] }
      },
      { 
        path: 'payments', 
        loadComponent: () => import('./features/payments/payments.component').then(m => m.PaymentsComponent),
        canActivate: [roleGuard],
        data: { title: 'Payment Management', subtitle: 'Rent Collection Cycle', roles: ['OWNER', 'STAFF'] }
      },
      { 
        path: 'maintenance', 
        loadComponent: () => import('./features/maintenance/maintenance.component').then(m => m.MaintenanceComponent),
        canActivate: [roleGuard],
        data: { title: 'Maintenance Tracker', subtitle: 'Tickets & Repairs', roles: ['OWNER', 'STAFF'] }
      },
      { 
        path: 'expenses', 
        loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent),
        canActivate: [roleGuard],
        data: { title: 'Expense Management', subtitle: 'General PG Expenses', roles: ['OWNER'] }
      },
      { 
        path: 'reports', 
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [roleGuard],
        data: { title: 'Reports & Analytics', subtitle: 'Business Performance', roles: ['OWNER'] }
      },
      { 
        path: 'settings', 
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [roleGuard],
        data: { title: 'Settings', subtitle: 'System Configuration', roles: ['OWNER'] }
      },
      { 
        path: 'admin', 
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        data: { title: 'Admin Panel', subtitle: 'Global Account Management' }
      },
      { 
        path: 'notifications', 
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        canActivate: [roleGuard],
        data: { title: 'Notifications', subtitle: 'Alerts & Messages', roles: ['OWNER', 'STAFF'] }
      }
    ]
  },

  { path: '**', redirectTo: '/dashboard' },
];
