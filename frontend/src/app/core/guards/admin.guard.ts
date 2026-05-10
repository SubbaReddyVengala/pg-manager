import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isSuperAdmin()) {
    return true;
  }

  // Redirect to dashboard if not super admin
  return router.parseUrl('/dashboard');
};
