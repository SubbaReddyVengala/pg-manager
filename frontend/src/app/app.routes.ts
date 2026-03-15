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
    ]
  },

  { path: '**', redirectTo: '/dashboard' },
];
