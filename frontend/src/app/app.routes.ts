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
      { path: '', loadComponent: () => import('./features/dashboard/home/home.component').then(m => m.HomeComponent) },
      { path: 'rooms',loadComponent: () => import('./features/rooms/rooms.component').then(m => m.RoomsComponent)},
      {path: 'tenants',loadComponent: () =>import('./features/tenants/tenants.component').then(m => m.TenantsComponent)},
      {path: 'tenants/:id',loadComponent: () =>import('./features/tenants/tenant-detail/tenant-detail.component')
      .then(m => m.TenantDetailComponent)
},

    ]
  },

  { path: '**', redirectTo: '/dashboard' },
];
