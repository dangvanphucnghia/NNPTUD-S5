import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // Check if trying to access home and user is admin
    if (state.url === '/home' && authService.isAdmin()) {
      router.navigate(['/admin-dashboard']); // Redirect to admin dashboard or another appropriate page
      return false;
    }
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
