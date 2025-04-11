import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-failed',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-failed.component.html',
  // styleUrls: ['./payment-failed.component.scss']
})
export class PaymentFailedComponent implements OnInit {
  errorMessage: string = '';
  paymentId: string = '';
  countdown: number = 15;
  timer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    // Lấy thông tin lỗi từ URL parameters
    this.route.queryParams.subscribe(params => {
      this.errorMessage = params['message'] || 'Thanh toán không thành công. Vui lòng thử lại sau.';
      this.paymentId = params['paymentId'] || '';

      // Nếu không có paymentId trong URL, thử lấy từ localStorage
      if (!this.paymentId) {
        this.paymentId = localStorage.getItem('currentPaymentId') || '';
        // Xóa dữ liệu tạm thời
        localStorage.removeItem('currentPaymentId');
        localStorage.removeItem('ticketAmount');
      }
    });

    // Khởi động countdown để tự động chuyển trang
    this.startCountdown();
  }

  startCountdown() {
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
        this.router.navigate(['/']);
      }
    }, 1000);
  }

  ngOnDestroy() {
    // Xóa timer khi component bị hủy
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  tryAgain() {
    clearInterval(this.timer);
    // Quay lại trang tìm kiếm chuyến bay
    this.router.navigate(['/flights']);
  }

  goHome() {
    clearInterval(this.timer);
    this.router.navigate(['/']);
  }

  contactSupport() {
    clearInterval(this.timer);
    // Redirect to support page or open email client
    window.location.href = 'mailto:support@skyjourney.vn';
  }
}
