import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard để bảo vệ các routes dành cho Admin
export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;  // Cho phép truy cập nếu là admin đã đăng nhập
  } else {
    router.navigate(['/admin/login']);  // Chuyển hướng đến trang đăng nhập admin
    return false;
  }
};

// Guard để bảo vệ các routes dành cho User thông thường
export const UserGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && !authService.isAdmin()) {
    return true;  // Cho phép truy cập nếu là user thường đã đăng nhập
  } else {
    router.navigate(['/login']);  // Chuyển hướng đến trang đăng nhập user
    return false;
  }
};