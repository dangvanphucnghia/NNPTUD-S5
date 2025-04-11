import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './payment-success.component.html',
  // styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  paymentId: string = '';
  amount: number = 0;
  countdown: number = 10;
  timer: any;
  loading: boolean = true;
  paymentDetails: any = null;
  tickets: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ticketService: TicketService
  ) { }

  ngOnInit() {
    // Lấy thông tin từ URL parameters
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['paymentId'] || '';
      this.amount = Number(params['amount'] || '0');

      if (this.paymentId) {
        this.fetchPaymentDetails();
      } else {
        // Nếu không có paymentId trong URL, lấy từ localStorage (trường hợp redirect từ VNPAY)
        this.paymentId = localStorage.getItem('currentPaymentId') || '';
        this.amount = Number(localStorage.getItem('ticketAmount') || '0');

        if (this.paymentId) {
          this.fetchPaymentDetails();
        } else {
          this.loading = false;
        }
      }
    });
  }

  fetchPaymentDetails() {
    this.loading = true;

    // Xóa phần kiểm tra if (this.ticketService.getPaymentStatus)
    this.ticketService.getPaymentStatus(this.paymentId).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.paymentDetails = response.payment;
          this.tickets = response.tickets || [];
          this.amount = this.paymentDetails.amount;

          // Xóa thông tin lưu trữ tạm thời
          localStorage.removeItem('currentPaymentId');
          localStorage.removeItem('ticketAmount');
        }
        this.loading = false;
        this.startCountdown();
      },
      error: (error) => {
        console.error('Error fetching payment details:', error);
        this.loading = false;
        this.startCountdown();
      }
    });
  }

  startCountdown() {
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
        this.router.navigate(['/my-tickets']);
      }
    }, 1000);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  viewTickets() {
    clearInterval(this.timer);
    this.router.navigate(['/my-tickets']);
  }

  goHome() {
    clearInterval(this.timer);
    this.router.navigate(['/']);
  }
}
