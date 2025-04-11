import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminGuard } from './guards/role.guard';
import { UserGuard } from './guards/role.guard';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AirlineManagementComponent } from './pages/airline-management/airline-management.component';
import { FlightManagementComponent } from './pages/flight-management/flight-management.component';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { TicketBookingComponent } from './pages/ticket-booking/ticket-booking.component';
import { MyTicketsComponent } from './pages/my-tickets/my-tickets.component';
import { AdminTicketManagementComponent } from './pages/admin-ticket/admin-ticket-management.component';
import { PaymentSuccessComponent } from './pages/payment-result/payment-success.component';
import { PaymentFailedComponent } from './pages/payment-result/payment-failed.component';
import { PromotionManagementComponent } from './pages/promotion-management/promotion-management.component';

export const routes: Routes = [
    // Route mặc định
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'profile', component: UserProfileComponent },
  { path: 'flights/:id/book', component: TicketBookingComponent, canActivate: [AuthGuard] },
    { path: 'my-tickets', component: MyTicketsComponent, canActivate: [AuthGuard] },
{ path: 'payment/success', component: PaymentSuccessComponent }, // Remove AuthGuard
{ path: 'payment/failed', component: PaymentFailedComponent },

// Hoặc bạn có thể thêm route mới để chuyển hướng từ VNPAY callback
{ path: 'checkout-success', redirectTo: '/payment/success', pathMatch: 'full' },
{ path: 'checkout-failed', redirectTo: '/payment/failed', pathMatch: 'full' },
    
  
  // Route cho Admin Login (phải đặt trước route admin để không bị guard chặn)
  { path: 'admin/login', component: AdminLoginComponent },
  
  // Routes cho Admin với AdminLayout
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'airlines', component: AirlineManagementComponent },
      { path: 'flights', component: FlightManagementComponent },
      { path: 'tickets', component: AdminTicketManagementComponent },
      { path: 'promotions', component: PromotionManagementComponent }
    ]
  },
  
  // Routes cho User thông thường
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  
  // Route mặc định cho 404 (để cuối cùng)
  { path: '**', redirectTo: '/hehe' }
];