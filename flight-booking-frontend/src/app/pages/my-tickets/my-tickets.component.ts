import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [HttpClient],
  templateUrl: './my-tickets.component.html',
  styleUrls: ['./my-tickets.component.css']
})
export class MyTicketsComponent implements OnInit {
  tickets: any[] = [];
  isLoading = false;
  error: string = '';

  constructor(
    private ticketService: TicketService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }

    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    console.log('Đang tải danh sách vé...');
    
    this.ticketService.getUserTickets().subscribe({
      next: (response) => {
        console.log('Phản hồi từ API vé:', response);
        
        // Kiểm tra cấu trúc response đúng chuẩn
        if (response && response.success === true && Array.isArray(response.data)) {
          this.tickets = response.data;
          console.log('Số lượng vé đã tải:', this.tickets.length);
        } else if (response && Array.isArray(response)) {
          // Trường hợp API trả về mảng trực tiếp
          this.tickets = response;
          console.log('Số lượng vé đã tải (response là mảng):', this.tickets.length);
        } else if (response && response.data) {
          // Trường hợp API trả về object với data bên trong
          this.tickets = response.data;
          console.log('Số lượng vé đã tải (từ response.data):', this.tickets.length);
        } else {
          console.error('Cấu trúc dữ liệu không đúng định dạng:', response);
          this.error = 'Không thể đọc dữ liệu vé';
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách vé:', error);
        this.error = 'Đã xảy ra lỗi khi tải danh sách vé';
        this.isLoading = false;
      }
    });
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'status-scheduled',
      'delayed': 'status-delayed',
      'cancelled': 'status-cancelled',
      'completed': 'status-completed',
      'pending': 'status-pending',
      'paid': 'status-paid',
      'unpaid': 'status-unpaid'
    };
    return statusMap[status] || '';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'Đã lên lịch',
      'delayed': 'Bị hoãn',
      'cancelled': 'Đã hủy',
      'completed': 'Đã hoàn thành',
      'pending': 'Đang chờ',
      'paid': 'Đã thanh toán',
      'unpaid': 'Chưa thanh toán'
    };
    return statusMap[status] || status;
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  formatTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  formatPrice(price: number): string {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  getUpcomingFlights(): number {
    if (!this.tickets || !this.tickets.length) return 0;
    
    const today = new Date();
    return this.tickets.filter(ticket => {
      if (!ticket.flightId || !ticket.flightId.departure || !ticket.flightId.departure.time) {
        return false;
      }
      const departureDate = new Date(ticket.flightId.departure.time);
      return departureDate > today && ticket.flightId.status !== 'cancelled';
    }).length;
  }
  
  getCompletedFlights(): number {
    if (!this.tickets || !this.tickets.length) return 0;
    
    return this.tickets.filter(ticket => {
      return ticket.flightId && ticket.flightId.status === 'completed';
    }).length;
  }
}