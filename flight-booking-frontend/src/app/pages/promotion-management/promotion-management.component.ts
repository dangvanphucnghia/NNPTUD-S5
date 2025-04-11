import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PromotionService, Promotion, ApiResponse } from '../../services/promotion.service';
import { FlightService } from '../../services/flight.service';
import { AirlineService } from '../../services/airline.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

interface Flight {
  _id: string;
  flightNumber: string;
  departure: {
    city: string;
    airport: string;
    time: string;
  };
  arrival: {
    city: string;
    airport: string;
    time: string;
  };
  airline: string | { _id: string; name: string; code: string };
  aircraft: string;
  seatsAvailable: number;
  price: number;
  status: string;
  isActive: boolean;
}

interface Airline {
  _id: string;
  name: string;
  code: string;
  logo: string;
  description: string;
  isActive: boolean;
}

@Component({
  selector: 'app-promotion-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './promotion-management.component.html',
  styleUrls: ['./promotion-management.component.scss']
})
export class PromotionManagementComponent implements OnInit {
  promotions: Promotion[] = [];
  flights: Flight[] = [];
  airlines: Airline[] = [];
  selectedPromotion: Promotion | null = null;
  isEditing = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  isLoading = false;
  showDeleted = false;
  activeTab = 'list';
  promotionForm: FormGroup;

  constructor(
    private promotionService: PromotionService,
    private flightService: FlightService,
    private airlineService: AirlineService,
    private fb: FormBuilder
  ) {
    this.promotionForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', Validators.required],
      description: ['', Validators.required],
      discountType: ['PERCENTAGE', Validators.required],
      discountValue: ['', [Validators.required, Validators.min(0)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      usageLimit: [''],
      isActive: [true],
      applicableFlights: [[]],
      applicableAirlines: [[]]
    });
  }

  ngOnInit(): void {
    this.loadPromotions();
    this.loadFlights();
    this.loadAirlines();
  }

  loadFlights(): void {
    this.flightService.getAllFlights().subscribe({
      next: (response: ApiResponse<Flight[]>) => {
        if (response.success && response.data) {
          this.flights = response.data;
          this.updateApplicableFlights();
        }
      },
      error: (error) => {
        console.error('Error loading flights:', error);
      }
    });
  }

  loadAirlines(): void {
    this.airlineService.getAllAirlines().subscribe({
      next: (response: ApiResponse<Airline[]>) => {
        if (response.success && response.data) {
          this.airlines = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading airlines:', error);
      }
    });
  }

  loadPromotions(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.promotionService.getAllPromotions().subscribe({
      next: (response: ApiResponse<Promotion[]>) => {
        if (response.success && response.data) {
          this.promotions = response.data;
          console.log('Loaded promotions:', this.promotions); // Debug log
          this.errorMessage = '';
        } else {
          this.errorMessage = response.message || 'Dữ liệu không hợp lệ';
          console.error('Invalid response format:', response);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi tải danh sách khuyến mãi';
        console.error('Error loading promotions:', error); // Debug log
        this.isLoading = false;
      }
    });
  }

  get filteredPromotions(): Promotion[] {
    if (!this.searchTerm) return this.promotions;
    const term = this.searchTerm.toLowerCase();
    return this.promotions.filter(promotion =>
      promotion.code.toLowerCase().includes(term) ||
      promotion.name.toLowerCase().includes(term) ||
      promotion.description.toLowerCase().includes(term)
    );
  }

  createPromotion(): void {
    this.selectedPromotion = null;
    this.promotionForm.reset({
      discountType: 'PERCENTAGE',
      isActive: true
    });
    this.isEditing = true;
  }

  editPromotion(promotion: Promotion): void {
    this.selectedPromotion = promotion;
    this.promotionForm.patchValue({
      code: promotion.code,
      name: promotion.name,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      startDate: this.formatDateForInput(promotion.startDate),
      endDate: this.formatDateForInput(promotion.endDate),
      usageLimit: promotion.usageLimit,
      isActive: promotion.isActive,
      applicableFlights: promotion.applicableFlights,
      applicableAirlines: promotion.applicableAirlines
    });
    this.isEditing = true;
  }

  savePromotion(): void {
    if (this.promotionForm.invalid) {
      this.errorMessage = 'Vui lòng kiểm tra lại thông tin nhập vào';
      return;
    }

    this.isLoading = true;
    const promotionData = this.promotionForm.value;

    // Ensure dates are properly formatted
    if (promotionData.startDate) {
      const startDate = new Date(promotionData.startDate);
      if (!isNaN(startDate.getTime())) {
        promotionData.startDate = startDate.toISOString();
      }
    }
    
    if (promotionData.endDate) {
      const endDate = new Date(promotionData.endDate);
      if (!isNaN(endDate.getTime())) {
        promotionData.endDate = endDate.toISOString();
      }
    }

    const saveObservable = this.selectedPromotion
      ? this.promotionService.updatePromotion(this.selectedPromotion._id, promotionData)
      : this.promotionService.createPromotion(promotionData);

    saveObservable.subscribe({
      next: (response: ApiResponse<Promotion>) => {
        if (response.success) {
          this.successMessage = this.selectedPromotion
            ? 'Cập nhật khuyến mãi thành công!'
            : 'Thêm khuyến mãi mới thành công!';
          this.isLoading = false;
          this.isEditing = false;
          this.loadPromotions();
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.errorMessage = response.message || 'Có lỗi xảy ra khi lưu khuyến mãi';
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi lưu khuyến mãi';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  deletePromotion(id: string): void {
    if (confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
      this.isLoading = true;
      this.promotionService.deletePromotion(id).subscribe({
        next: (response: ApiResponse<void>) => {
          if (response.success) {
            this.successMessage = 'Xóa khuyến mãi thành công!';
            this.loadPromotions();
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.message || 'Có lỗi xảy ra khi xóa khuyến mãi';
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi xóa khuyến mãi';
          this.isLoading = false;
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  restorePromotion(id: string): void {
    this.isLoading = true;
    this.promotionService.updatePromotion(id, { isActive: true }).subscribe({
      next: (response: ApiResponse<Promotion>) => {
        if (response.success) {
          this.successMessage = 'Khôi phục khuyến mãi thành công!';
          this.loadPromotions();
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.errorMessage = response.message || 'Có lỗi xảy ra khi khôi phục khuyến mãi';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi khôi phục khuyến mãi';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  toggleDeletedPromotions(): void {
    this.showDeleted = !this.showDeleted;
    this.loadPromotions();
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.selectedPromotion = null;
    this.promotionForm.reset();
  }

  private formatDateForInput(date: string): string {
    return new Date(date).toISOString().slice(0, 16);
  }

  getDiscountDisplay(promotion: Promotion): string {
    return promotion.discountType === 'PERCENTAGE' 
      ? `${promotion.discountValue}%`
      : `$${promotion.discountValue}`;
  }

  updateApplicableFlights(): void {
    const selectedAirlines = this.promotionForm.get('applicableAirlines')?.value || [];
    console.log('Updating applicable flights for airlines:', selectedAirlines);
    
    if (selectedAirlines.length > 0) {
      // Lọc chuyến bay dựa trên hãng hàng không đã chọn
      const filteredFlights = this.flights.filter(flight => {
        const flightAirlineId = typeof flight.airline === 'string' 
          ? flight.airline 
          : (flight.airline as { _id: string })._id;
        
        return selectedAirlines.includes(flightAirlineId);
      });
      
      console.log('Filtered flights for form update:', filteredFlights);
      
      // Cập nhật danh sách chuyến bay áp dụng trong form
      this.promotionForm.patchValue({
        applicableFlights: filteredFlights.map(flight => flight._id)
      });
    } else {
      // Nếu không có hãng hàng không nào được chọn, xóa danh sách chuyến bay
      this.promotionForm.patchValue({
        applicableFlights: []
      });
    }
  }

  getFilteredFlights(): Flight[] {
    const selectedAirlines = this.promotionForm.get('applicableAirlines')?.value || [];
    console.log('Selected Airlines:', selectedAirlines);
    console.log('All Flights:', this.flights);
    console.log('All Airlines:', this.airlines);
    
    if (selectedAirlines.length === 0) {
      return [];
    }
    
    const filteredFlights = this.flights.filter(flight => {
      // Lấy ID của hãng hàng không từ flight
      const flightAirlineId = typeof flight.airline === 'string' 
        ? flight.airline 
        : (flight.airline as { _id: string })._id;
      
      // Tìm thông tin hãng hàng không
      const airline = this.airlines.find(a => a._id === flightAirlineId);
      
      console.log('Flight:', flight.flightNumber, 'Airline ID:', flightAirlineId, 'Airline:', airline?.name);
      
      // Kiểm tra xem hãng hàng không có trong danh sách đã chọn không
      const isIncluded = selectedAirlines.includes(flightAirlineId);
      console.log('Is included in selected airlines:', isIncluded);
      
      return isIncluded;
    });
    
    console.log('Filtered Flights:', filteredFlights);
    return filteredFlights;
  }

  onAirlineSelectionChange(): void {
    console.log('Airline selection changed');
    // Clear selected flights when airlines change
    this.promotionForm.patchValue({
      applicableFlights: []
    });
  }

  // Lấy tất cả chuyến bay áp dụng khuyến mãi
  getAllApplicableFlights(): Flight[] {
    // Tạo một Set để lưu trữ các chuyến bay duy nhất
    const uniqueFlights = new Set<Flight>();
    
    // Duyệt qua tất cả khuyến mãi
    this.promotions.forEach(promotion => {
      if (promotion.isActive && promotion.applicableFlights) {
        // Duyệt qua tất cả chuyến bay áp dụng của khuyến mãi
        promotion.applicableFlights.forEach(flight => {
          // Thêm chuyến bay vào Set (nếu đã tồn tại sẽ không thêm lại)
          uniqueFlights.add(flight);
        });
      }
    });
    
    // Chuyển Set thành mảng và sắp xếp theo mã chuyến bay
    return Array.from(uniqueFlights).sort((a, b) => 
      a.flightNumber.localeCompare(b.flightNumber)
    );
  }

  // Lấy danh sách khuyến mãi áp dụng cho một chuyến bay
  getPromotionsForFlight(flight: Flight): Promotion[] {
    return this.promotions.filter(promotion => 
      promotion.isActive && 
      promotion.applicableFlights?.some(f => f._id === flight._id)
    );
  }

  // Tính giá sau khi áp dụng khuyến mãi
  getDiscountedPrice(flight: Flight): number {
    // Lấy khuyến mãi có giá trị giảm cao nhất
    const applicablePromotions = this.getPromotionsForFlight(flight);
    if (applicablePromotions.length === 0) {
      return flight.price;
    }
    
    // Tính giá sau khi áp dụng khuyến mãi có giá trị giảm cao nhất
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
    
    // Áp dụng giảm giá cao nhất
    const finalPrice = flight.price - Math.max(maxDiscountAmount, maxDiscount);
    return Math.max(finalPrice, 0); // Đảm bảo giá không âm
  }
} 