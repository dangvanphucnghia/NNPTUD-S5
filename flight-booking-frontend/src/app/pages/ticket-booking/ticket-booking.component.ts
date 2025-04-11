import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { HttpClient } from '@angular/common/http';
import { PromotionService, Promotion } from '../../services/promotion.service';

@Component({
  selector: 'app-ticket-booking',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, DatePipe, CurrencyPipe],
  providers: [HttpClient],
  templateUrl: './ticket-booking.component.html',
  styleUrls: ['./ticket-booking.component.scss']
})
export class TicketBookingComponent implements OnInit, AfterViewInit {
  flightId: string | null = null;
  flight: any = null;
  bookingForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  seatLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  availableSeats: string[] = [];
  currentSeatSelectionIndex = 0;
  promoCode: string = '';
  promoApplied: boolean = false;
  promoError: string = '';
  discountAmount: number = 0;
  totalAmount: number = 0;
  selectedPaymentMethod: string = 'card';
  selectedSeats: string[] = [];
  promotions: Promotion[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private flightService: FlightService,
    private ticketService: TicketService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private promotionService: PromotionService
  ) {
    this.bookingForm = this.fb.group({
      passengers: this.fb.array([])
    });
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }

    this.route.paramMap.subscribe(params => {
      this.flightId = params.get('id');
      if (this.flightId) {
        this.loadFlightDetails();
      } else {
        this.router.navigate(['/flights']);
      }
    });
    
    this.loadPromotions();
  }

  ngAfterViewInit(): void {
    // Open seat map modal
    document.querySelectorAll('[id^="openSeatMapBtn"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = document.getElementById('seatMapModal');
        if (modal) modal.style.display = 'flex';
      });
    });

    // Close seat map modal
    document.getElementById('closeSeatMapBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('seatMapModal');
      if (modal) modal.style.display = 'none';
    });

    // Apply promo code with Ajax simulation
    document.getElementById('applyPromoBtn')?.addEventListener('click', () => {
      const input = document.getElementById('promoCodeInput') as HTMLInputElement;
      const promoCode = input?.value?.trim() || '';
      
      if (!promoCode) return;
      
      // Show loading effect
      const applyBtn = document.getElementById('applyPromoBtn');
      applyBtn?.classList.add('pulse-effect');
      if (applyBtn) applyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      
      // Simulate Ajax request
      setTimeout(() => {
        applyBtn?.classList.remove('pulse-effect');
        if (applyBtn) applyBtn.innerHTML = 'Áp dụng';
        
        if (promoCode.toUpperCase() === 'NEWUSER' || promoCode.toUpperCase() === 'SUMMER2025') {
          const successEl = document.getElementById('promoSuccess');
          const errorEl = document.getElementById('promoError');
          if (successEl) successEl.style.display = 'flex';
          if (errorEl) errorEl.style.display = 'none';
          this.promoApplied = true;
          this.promoError = '';
          this.discountAmount = this.flight.price * 0.1 * this.passengers.length; // 10% discount
          this.calculateTotal();
          this.showToast('Thành công', 'Đã áp dụng mã khuyến mãi thành công!', 'success');
        } else {
          const successEl = document.getElementById('promoSuccess');
          const errorEl = document.getElementById('promoError');
          if (successEl) successEl.style.display = 'none';
          if (errorEl) errorEl.style.display = 'flex';
          this.promoApplied = false;
          this.promoError = 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn';
          this.discountAmount = 0;
          this.calculateTotal();
          this.showToast('Lỗi', 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn', 'error');
        }
      }, 1000);
    });
    
    // Add passenger with animation
    document.getElementById('addPassengerBtn')?.addEventListener('click', () => {
      setTimeout(() => {
        const passengers = document.querySelectorAll('.passenger-card');
        const lastPassenger = passengers[passengers.length - 1];
        if (lastPassenger) lastPassenger.classList.add('fade-in');
      }, 0);
    });

    // Confirm seat selection
    document.getElementById('confirmSeatBtn')?.addEventListener('click', () => {
      const modal = document.getElementById('seatMapModal');
      if (modal) modal.style.display = 'none';
    });
  }

  loadFlightDetails(): void {
    this.isLoading = true;
    this.flightService.getFlightById(this.flightId!).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.flight = response.data;
          this.generateAvailableSeats();
          this.addPassenger(); // Add one passenger form by default
          this.applyPromotions(); // Apply promotions if any
          this.calculateTotal();
        } else {
          this.notificationService.showNotification('Không thể tải thông tin chuyến bay');
          this.router.navigate(['/flights']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading flight details:', error);
        this.notificationService.showNotification('Đã xảy ra lỗi khi tải thông tin chuyến bay');
        this.router.navigate(['/flights']);
        this.isLoading = false;
      }
    });
  }

  calculateTotal(): void {
    if (this.flight) {
      this.totalAmount = this.flight.price * this.passengers.length - this.discountAmount;
    }
  }

  generateAvailableSeats(): void {
    const totalSeats = this.flight.seatsAvailable;
    const rows = Math.ceil(totalSeats / 6); // 6 seats per row (A-F)
    
    this.availableSeats = [];
    for (let row = 1; row <= rows; row++) {
      for (let seatIndex = 0; seatIndex < 6; seatIndex++) {
        if (this.availableSeats.length < totalSeats) {
          this.availableSeats.push(`${row}${this.seatLetters[seatIndex]}`);
        }
      }
    }
  }

  get passengers(): FormArray {
    return this.bookingForm.get('passengers') as FormArray;
  }

  addPassenger(): void {
    const passengerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('[0-9]{10}')]],
      seatNumber: ['', Validators.required]
    });

    this.passengers.push(passengerForm);
    this.calculateTotal();
  }

  removePassenger(index: number): void {
    this.passengers.removeAt(index);
    this.calculateTotal();
  }

  isFormValid(): boolean {
    return this.bookingForm.valid && this.passengers.length > 0;
  }

  // Phương thức này được gọi từ template
  submitBooking(): void {
    // Chỉ gọi xacNhanDatVe để xử lý
    this.xacNhanDatVe();
  }

  getPassengerTitle(index: number): string {
    return `Hành khách ${index + 1}`;
  }

  isSeatTaken(seatNumber: string): boolean {
    if (!seatNumber) return false;
    
    const currentSelections = this.passengers.value
      .map((p: any) => p.seatNumber)
      .filter((s: string) => s === seatNumber);
    
    return currentSelections.length > 1;
  }

  // Các hàm bổ sung cần thiết cho template
  getFlightDuration(flight: any): string {
    const departureTime = new Date(flight.departure.time);
    const arrivalTime = new Date(flight.arrival.time);
    
    const durationMs = arrivalTime.getTime() - departureTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  applyPromoCode(): void {
    // Xử lý trong ngAfterViewInit
  }

  openSeatMap(event: Event): void {
    const modal = document.getElementById('seatMapModal');
    if (modal) modal.style.display = 'flex';
    event.stopPropagation();
  }

  isAvailableSeat(seat: string): boolean {
    return this.availableSeats.includes(seat);
  }

  isSelectedSeat(seat: string): boolean {
    return this.passengers.controls.some(
      (control: any) => control.get('seatNumber')?.value === seat
    );
  }

  selectSeat(seat: string): void {
    if (this.isAvailableSeat(seat) && !this.isSelectedSeat(seat)) {
      // Lấy passenger form đầu tiên chưa chọn ghế
      for (let i = 0; i < this.passengers.length; i++) {
        const passenger = this.passengers.at(i);
        if (!passenger.get('seatNumber')?.value) {
          passenger.get('seatNumber')?.setValue(seat);
          break;
        }
      }
    }
  }

  showToast(title: string, message: string, type: 'success' | 'error'): void {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <div class="toast-close">
        <i class="fa-solid fa-times"></i>
      </div>
    `;
    
    toastContainer?.appendChild(toast);
    
    // Remove toast after animation
    setTimeout(() => {
      toast.remove();
    }, 3000);
    
    // Close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn?.addEventListener('click', () => {
      toast.remove();
    });
  }

  // Phương thức xác nhận đặt vé - xử lý chính
  xacNhanDatVe(): void {
    if (!this.isFormValid()) {
      this.bookingForm.markAllAsTouched();
      this.showToast('Lỗi', 'Vui lòng điền đầy đủ thông tin vé', 'error');
      return;
    }
  
    // Lấy danh sách thông tin hành khách từ form
    const tickets = this.passengers.value;
    
    // Tính toán giá đã giảm dựa trên khuyến mãi của chuyến bay
    const discountedPricePerTicket = this.getDiscountedPrice(this.flight);
    const totalDiscountedPrice = discountedPricePerTicket * this.passengers.length;
  
    // Bắt đầu loading
    this.isSubmitting = true;
  
    // Kiểm tra token trước khi đặt vé
    this.ticketService.verifyToken().subscribe({
      next: (response) => {
        console.log('Token verification successful:', response);
        
        // Gọi service để đặt vé và thanh toán với giá đã giảm
        this.ticketService.bookTicket(this.flightId!, tickets, totalDiscountedPrice).subscribe({
          next: (response) => {
            console.log('Phản hồi đặt vé:', response);
            
            if (response && response.paymentUrl) {
              console.log('Đã nhận được URL thanh toán:', response.paymentUrl);
              
              if (response.paymentId) {
                localStorage.setItem('currentPaymentId', response.paymentId);
              }
              if (response.totalPrice) {
                localStorage.setItem('ticketAmount', response.totalPrice.toString());
              }
              
              this.notificationService.showNotification('Đặt vé thành công! Đang chuyển hướng đến trang thanh toán...');
              
              setTimeout(() => {
                window.location.href = response.paymentUrl;
              }, 1500);
            } else {
              this.notificationService.showNotification('Đặt vé thành công!');
              this.router.navigate(['/my-tickets']);
            }
            
            this.isSubmitting = false;
          },
          error: (error) => {
            this.handleBookingError(error);
          }
        });
      },
      error: (error) => {
        console.error('Token verification failed:', error);
        this.isSubmitting = false;
        this.notificationService.showNotification('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      }
    });
  }
  
  // Thêm phương thức này để xử lý lỗi khi đặt vé
  handleBookingError(error: any): void {
    console.error('Lỗi khi đặt vé:', error);
    let errorMessage = 'Đã xảy ra lỗi khi đặt vé. Vui lòng thử lại sau.';
    
    // Hiển thị chi tiết lỗi nếu có
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }
    
    // Xử lý các mã lỗi cụ thể
    if (error.status === 403) {
      errorMessage = 'Không có quyền truy cập. Vui lòng đăng nhập lại và thử lại.';
      localStorage.removeItem('token');
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      }, 2000);
    } else if (error.status === 400) {
      errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin vé.';
    } else if (error.status === 404) {
      errorMessage = 'Không tìm thấy chuyến bay. Vui lòng thử lại sau.';
    }
    
    this.notificationService.showNotification(errorMessage);
    this.isSubmitting = false;
  }

  loadPromotions(): void {
    this.promotionService.getAllPromotions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.promotions = response.data;
          // Recalculate total with promotions if flight is already loaded
          if (this.flight) {
            this.applyPromotions();
          }
        }
      },
      error: (error) => {
        console.error('Error loading promotions:', error);
      }
    });
  }

  // Check if flight has any applicable promotions
  hasPromotion(flight: any): boolean {
    return this.getPromotionsForFlight(flight).length > 0;
  }

  // Check if flight is within promotion period
  isFlightInPromotionPeriod(flight: any, promotion: Promotion): boolean {
    const flightTime = new Date(flight.departure.time).getTime();
    const promotionStart = new Date(promotion.startDate).getTime();
    const promotionEnd = new Date(promotion.endDate).getTime();
    
    return flightTime >= promotionStart && flightTime <= promotionEnd;
  }

  // Get promotions applicable to this flight
  getPromotionsForFlight(flight: any): Promotion[] {
    if (!flight || !this.promotions) return [];
    
    return this.promotions.filter(promotion => 
      promotion.isActive && 
      promotion.applicableFlights?.some(f => f._id === flight._id) &&
      this.isFlightInPromotionPeriod(flight, promotion)
    );
  }

  // Calculate discounted price for the flight
  getDiscountedPrice(flight: any): number {
    if (!flight) return 0;
    
    const applicablePromotions = this.getPromotionsForFlight(flight);
    if (applicablePromotions.length === 0) {
      return flight.price;
    }
    
    let maxDiscount = 0;
    let maxDiscountAmount = 0;
    
    applicablePromotions.forEach(promotion => {
      if (promotion.discountType === 'PERCENTAGE') {
        const discountAmount = flight.price * (promotion.discountValue / 100);
        if (discountAmount > maxDiscountAmount) {
          maxDiscountAmount = discountAmount;
        }
      } else if (promotion.discountType === 'FIXED_AMOUNT') {
        if (promotion.discountValue > maxDiscount) {
          maxDiscount = promotion.discountValue;
        }
      }
    });
    
    const finalPrice = flight.price - Math.max(maxDiscountAmount, maxDiscount);
    return Math.max(finalPrice, 0);
  }

  // Apply promotions to the current flight
  applyPromotions(): void {
    if (!this.flight) return;
    
    const applicablePromotions = this.getPromotionsForFlight(this.flight);
    if (applicablePromotions.length > 0) {
      // Calculate the maximum discount
      let maxDiscount = 0;
      let maxDiscountAmount = 0;
      
      applicablePromotions.forEach(promotion => {
        if (promotion.discountType === 'PERCENTAGE') {
          const discountAmount = this.flight.price * (promotion.discountValue / 100);
          if (discountAmount > maxDiscountAmount) {
            maxDiscountAmount = discountAmount;
          }
        } else if (promotion.discountType === 'FIXED_AMOUNT') {
          if (promotion.discountValue > maxDiscount) {
            maxDiscount = promotion.discountValue;
          }
        }
      });
      
      // Apply the maximum discount
      this.discountAmount = Math.max(maxDiscountAmount, maxDiscount) * this.passengers.length;
      this.calculateTotal();
    }
  }
}