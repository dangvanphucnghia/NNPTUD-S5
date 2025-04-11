import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FlightService } from '../../services/flight.service';
import { AirlineService } from '../../services/airline.service';
import { PromotionService, Promotion } from '../../services/promotion.service';
import { Router } from '@angular/router';

interface Flight {
  _id: string;
  airline: any;
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
  aircraft: string;
  seatsAvailable: number;
  price: number;
  status: string;
  isActive: boolean;
}

interface Location {
  city: string;
  airport: string;
  code: string;
}

interface Airline {
  _id: string;
  name: string;
  code: string;
  logo?: string;
}

@Component({
  selector: 'app-flight-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './flight-management.component.html',
  styleUrls: ['./flight-management.component.scss']
})
export class FlightManagementComponent implements OnInit {
  flights: Flight[] = [];
  locations: Location[] = [];
  airlines: Airline[] = [];
  promotions: Promotion[] = [];
  selectedFlight: Flight | null = null;
  isEditing = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  isLoading = false;
  showDeleted = false;
  flightForm: FormGroup;

  constructor(
    private flightService: FlightService,
    private airlineService: AirlineService,
    private promotionService: PromotionService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.flightForm = this.fb.group({
      flightNumber: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{2,8}$')]],
      airline: ['', Validators.required],
      departure: this.fb.group({
        city: ['', Validators.required],
        airport: ['', Validators.required],
        time: ['', Validators.required]
      }),
      arrival: this.fb.group({
        city: ['', Validators.required],
        airport: ['', Validators.required],
        time: ['', Validators.required]
      }),
      aircraft: ['', Validators.required],
      seatsAvailable: ['', [Validators.required, Validators.min(0)]],
      price: ['', [Validators.required, Validators.min(0)]],
      status: ['scheduled', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadFlights();
    this.loadLocations();
    this.loadAirlines();
    this.loadPromotions();
  }

  loadFlights() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.flightService.getAllFlights(this.showDeleted).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.flights = response.data;
          this.errorMessage = '';
        } else {
          this.errorMessage = response.message || 'Dữ liệu không hợp lệ';
          console.error('Invalid response format:', response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi tải danh sách chuyến bay';
        this.isLoading = false;
      }
    });
  }

  loadLocations() {
    this.flightService.getLocations().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.locations = response.data;
        } else {
          console.error('Lỗi khi tải danh sách địa điểm:', response.message);
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách địa điểm:', error);
      }
    });
  }

  loadAirlines() {
    this.airlineService.getAllAirlines(false).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.airlines = response.data;
        } else {
          console.error('Lỗi khi tải danh sách hãng bay:', response.message);
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách hãng bay:', error);
      }
    });
  }

  loadPromotions() {
    this.promotionService.getAllPromotions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.promotions = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading promotions:', error);
      }
    });
  }

  get filteredFlights() {
    if (!this.searchTerm) return this.flights;
    const term = this.searchTerm.toLowerCase();
    return this.flights.filter(flight =>
      flight.flightNumber.toLowerCase().includes(term) ||
      flight.departure.city.toLowerCase().includes(term) ||
      flight.arrival.city.toLowerCase().includes(term)
    );
  }

  createFlight() {
    this.selectedFlight = null;
    this.flightForm.reset({
      status: 'scheduled'
    });
    this.isEditing = true;
  }

  editFlight(flight: Flight) {
    this.selectedFlight = flight;
    this.flightForm.patchValue({
      flightNumber: flight.flightNumber,
      airline: flight.airline?._id,
      departure: {
        city: flight.departure.city,
        airport: flight.departure.airport,
        time: new Date(flight.departure.time).toISOString().slice(0, 16)
      },
      arrival: {
        city: flight.arrival.city,
        airport: flight.arrival.airport,
        time: new Date(flight.arrival.time).toISOString().slice(0, 16)
      },
      aircraft: flight.aircraft,
      seatsAvailable: flight.seatsAvailable,
      price: flight.price,
      status: flight.status
    });
    this.isEditing = true;
  }

  saveFlight() {
    if (this.flightForm.invalid) {
      this.errorMessage = 'Vui lòng kiểm tra lại thông tin nhập vào';
      return;
    }

    this.isLoading = true;
    const flightData = this.flightForm.value;

    // Ensure departure and arrival times are properly formatted
    if (flightData.departure && flightData.departure.time) {
      const departureTime = new Date(flightData.departure.time);
      if (!isNaN(departureTime.getTime())) {
        flightData.departure.time = departureTime.toISOString();
      }
    }
    
    if (flightData.arrival && flightData.arrival.time) {
      const arrivalTime = new Date(flightData.arrival.time);
      if (!isNaN(arrivalTime.getTime())) {
        flightData.arrival.time = arrivalTime.toISOString();
      }
    }

    const saveObservable = this.selectedFlight
      ? this.flightService.updateFlight(this.selectedFlight._id, flightData)
      : this.flightService.createFlight(flightData);

    saveObservable.subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = this.selectedFlight
            ? 'Cập nhật chuyến bay thành công!'
            : 'Thêm chuyến bay mới thành công!';
          this.isLoading = false;
          this.isEditing = false;
          this.loadFlights();
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.errorMessage = response.message || 'Có lỗi xảy ra khi lưu chuyến bay';
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi lưu chuyến bay';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  deleteFlight(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa chuyến bay này?')) {
      this.isLoading = true;
      this.flightService.deleteFlight(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Xóa chuyến bay thành công!';
            this.loadFlights();
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.message || 'Có lỗi xảy ra khi xóa chuyến bay';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi xóa chuyến bay';
          this.isLoading = false;
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  restoreFlight(id: string) {
    this.isLoading = true;
    this.flightService.restoreFlight(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Khôi phục chuyến bay thành công!';
          this.loadFlights();
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.errorMessage = response.message || 'Có lỗi xảy ra khi khôi phục chuyến bay';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Có lỗi xảy ra khi khôi phục chuyến bay';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  toggleDeletedFlights() {
    this.showDeleted = !this.showDeleted;
    this.loadFlights();
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedFlight = null;
    this.flightForm.reset();
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'badge-scheduled',
      'delayed': 'badge-delayed',
      'cancelled': 'badge-cancelled',
      'completed': 'badge-completed'
    };
    return statusMap[status] || '';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  onCityChange(event: Event, type: 'departure' | 'arrival') {
    const city = (event.target as HTMLSelectElement).value;
    const location = this.locations.find(loc => loc.city === city);
    if (location) {
      this.flightForm.get(type)?.patchValue({
        airport: location.airport
      });
    }
  }

  getPromotionsForFlight(flight: Flight): Promotion[] {
    return this.promotions.filter(promotion => 
      promotion.isActive && 
      promotion.applicableFlights?.some(f => f._id === flight._id) &&
      this.isFlightInPromotionPeriod(flight, promotion)
    );
  }

  isFlightInPromotionPeriod(flight: Flight, promotion: Promotion): boolean {
    const flightTime = new Date(flight.departure.time).getTime();
    const promotionStart = new Date(promotion.startDate).getTime();
    const promotionEnd = new Date(promotion.endDate).getTime();
    
    return flightTime >= promotionStart && flightTime <= promotionEnd;
  }

  getDiscountedPrice(flight: Flight): number {
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

  hasPromotion(flight: Flight): boolean {
    return this.getPromotionsForFlight(flight).length > 0;
  }
}