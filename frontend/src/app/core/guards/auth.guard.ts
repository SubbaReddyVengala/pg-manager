import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (authService.isLoggedIn()) {
    // 1. Force password reset if it's the first login
    if (authService.isFirstLogin() && state.url !== '/auth/reset-password') {
      router.navigate(['/auth/reset-password']);
      return false;
    }

    // 2. If Super Admin lands on '/dashboard' root, redirect to '/dashboard/admin'
    if (authService.isSuperAdmin() && state.url === '/dashboard') {
      router.navigate(['/dashboard/admin']);
      return false;
    }
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};