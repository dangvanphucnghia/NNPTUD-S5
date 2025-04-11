import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../services/user.service';

interface DashboardStats {
  totalUsers: number;
  flightsToday: number;
  ticketsSold: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  // Dashboard statistics
  totalUsers: number | null = null;
  isLoadingUsers: boolean = true;
  flightsToday: number = 0;
  ticketsSold: number = 40;
  totalRevenue: number = 44302000;
  
  // Recent activities could be fetched from API
  recentActivities = [
    {
      type: 'user',
      title: 'Người dùng mới đăng ký',
      subtitle: 'Trần Văn A đã tạo tài khoản mới',
      time: '2 giờ trước'
    },
    {
      type: 'booking',
      title: 'Đặt vé mới',
      subtitle: 'Nguyễn Thị B đã đặt vé HN-HCM',
      time: '5 giờ trước'
    },
    {
      type: 'update',
      title: 'Cập nhật thông tin chuyến bay',
      subtitle: 'Admin đã cập nhật thông tin chuyến VN123',
      time: 'Hôm qua'
    },
    {
      type: 'delete',
      title: 'Xóa khuyến mãi',
      subtitle: 'Admin đã xóa khuyến mãi "Hè vui vẻ"',
      time: '2 ngày trước'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    this.loadUserCount();
  }

  private loadUserCount() {
    this.isLoadingUsers = true;
    this.userService.getUserCount().subscribe({
      next: (response) => {
        this.isLoadingUsers = false;
        if (response && response.total !== undefined) {
          this.totalUsers = response.total;
        } else {
          this.totalUsers = 0;
        }
      },
      error: (error) => {
        this.isLoadingUsers = false;
        this.totalUsers = 0;
        console.error('Error loading user count:', error);
      }
    });
  }

  private loadDashboardData() {
    // Add auth token header
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/admin/login']);
      return;
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Call API to get dashboard statistics
    this.http.get<DashboardStats>('http://localhost:8000/v1/admin/dashboard/stats', { headers })
      .subscribe({
        next: (data) => {
          // Update statistics with data from API (except totalUsers which comes from user service)
          this.flightsToday = data.flightsToday;
          this.ticketsSold = data.ticketsSold;
          this.totalRevenue = data.totalRevenue;
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
          if (error.status === 401) {
            this.router.navigate(['/admin/login']);
          }
          // Use default values if API fails
        }
      });
  }

  /**
   * Format currency for display
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(value);
  }
}