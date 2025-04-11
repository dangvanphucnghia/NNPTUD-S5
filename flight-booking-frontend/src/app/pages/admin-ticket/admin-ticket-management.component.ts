import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

interface Ticket {
  _id: string;
  flightId?: {
    _id: string;
    flightNumber?: string;
    airline?: {
      name?: string;
      code?: string;
    };
    departure?: {
      city?: string;
      airport?: string;
      time?: string;
    };
    arrival?: {
      city?: string;
      airport?: string;
      time?: string;
    };
  };
  userId?: {
    _id: string;
    username?: string;
    email?: string;
  };
  seatNumber?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-admin-ticket-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-ticket-management.component.html',
  styleUrls: ['./admin-ticket-management.component.scss']
})
export class AdminTicketManagementComponent implements OnInit {
  tickets: Ticket[] = [];
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  isLoading = false;
  statusFilter = 'all';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/admin/login']);
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadTickets() {
    this.isLoading = true;
    this.errorMessage = '';
    
    const headers = this.getHeaders();
    this.http.get<any>('http://localhost:8000/v1/tickets/admin', { headers })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.tickets = response.data;
            this.errorMessage = '';
          } else {
            this.errorMessage = response.message || 'Dữ liệu không hợp lệ';
            console.error('Invalid response format:', response);
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi tải danh sách vé';
          console.error('Error loading tickets:', error);
          this.isLoading = false;
          
          if (error.status === 401) {
            this.router.navigate(['/admin/login']);
          }
        }
      });
  }

  get filteredTickets() {
    if (!this.tickets) return [];

    let result = this.tickets;

    // Apply status filter
    if (this.statusFilter !== 'all') {
      result = result.filter(ticket => ticket.status === this.statusFilter);
    }

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(ticket => 
        ticket.fullName?.toLowerCase().includes(term) ||
        ticket.flightId?.flightNumber?.toLowerCase().includes(term) ||
        ticket.seatNumber?.toLowerCase().includes(term) ||
        ticket.email?.toLowerCase().includes(term) ||
        ticket.phone?.includes(term) ||
        ticket.userId?.username?.toLowerCase().includes(term) ||
        ticket.userId?.email?.toLowerCase().includes(term)
      );
    }

    return result;
  }

  cancelTicket(ticketId: string) {
    if (confirm('Bạn có chắc chắn muốn hủy vé này?')) {
      this.isLoading = true;
      
      const headers = this.getHeaders();
      this.http.patch<any>(
        `http://localhost:8000/v1/tickets/${ticketId}/cancel`,
        {},
        { headers }
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Hủy vé thành công';
            this.loadTickets();
          } else {
            this.errorMessage = response.message || 'Không thể hủy vé';
          }
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Không thể hủy vé';
          console.error('Error canceling ticket:', error);
          this.isLoading = false;
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  confirmTicket(ticketId: string) {
    this.isLoading = true;
    
    const headers = this.getHeaders();
    this.http.patch<any>(
      `http://localhost:8000/v1/tickets/${ticketId}/confirm`,
      {},
      { headers }
    )
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Xác nhận vé thành công';
          this.loadTickets();
        } else {
          this.errorMessage = response.message || 'Không thể xác nhận vé';
        }
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể xác nhận vé';
        console.error('Error confirming ticket:', error);
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'confirmed': 'badge-success',
      'pending': 'badge-warning',
      'cancelled': 'badge-danger',
      'completed': 'badge-info'
    };
    return statusMap[status] || '';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}