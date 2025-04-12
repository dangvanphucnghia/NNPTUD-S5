import { Component, OnInit, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FlightService } from '../../services/flight.service';
import { PromotionService, Promotion } from '../../services/promotion.service';
import { TranslocoService } from '@ngneat/transloco'; // 🆕 Import Transloco
import { TranslocoModule } from '@ngneat/transloco'; // ✅ Add this
import { NotificationService } from '../../services/notification.service'; 
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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule, ReactiveFormsModule, TranslocoModule],
  providers: [HttpClient],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  notifications: any[] = [];
  user: { username: string } | null = null;
  searchForm: FormGroup;
  locations: string[] = [];
  filteredDepartureLocations: string[] = [];
  filteredDestinationLocations: string[] = [];
  flights: Flight[] = [];
  displayedFlights: Flight[] = []; // Flights to display on current page
  isLoading = false;
  currentLang: string = 'vi'; // 🆕 Default language
  slugifiedUsername: string | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  promotions: Promotion[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private flightService: FlightService,
    private promotionService: PromotionService,
    private router: Router,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    
    private translocoService: TranslocoService // 🆕 Inject Transloco
  ) {
    this.searchForm = this.fb.group({
      departure: ['', Validators.required],
      destination: ['', Validators.required],
      departureDate: ['', Validators.required],
      returnDate: ['']
    });
  }

  ngOnInit() {
    const savedLang = localStorage.getItem('lang') || this.translocoService.getActiveLang();
    this.translocoService.setActiveLang(savedLang);
    this.currentLang = savedLang;

    const username = this.authService.getUserInfo();
    this.user = username ? { username } : null;
    if (this.user?.username && this.currentLang === 'en') {
      this.slugifiedUsername = this.stringToSlug(this.user.username);
    } else {
      this.slugifiedUsername = this.user?.username || null;
    }
    this.notificationService.getMyNotifications().subscribe({
      next: (res) => {
        this.notifications = res.data;
      },
      error: (err) => {
        console.error('Lỗi khi lấy thông báo:', err);
      }
    });

    const today = new Date();
    const formattedDate = this.formatDate(today);
    this.searchForm.get('departureDate')?.setValue(formattedDate);

    this.loadFlights();
    this.loadLocations();
    this.loadPromotions();
    

    this.searchForm.get('departure')?.valueChanges.subscribe(value => {
      this.filterDepartureLocations(value);
    });

    this.searchForm.get('destination')?.valueChanges.subscribe(value => {
      this.filterDestinationLocations(value);
    });
    
  }
  showNotiPanel: boolean = false;
  toggleNotificationPanel() {
    this.showNotiPanel = !this.showNotiPanel;
  }

  switchLang(): void {
    this.currentLang = this.currentLang === 'vi' ? 'en' : 'vi';
    this.translocoService.setActiveLang(this.currentLang);
    localStorage.setItem('lang', this.currentLang);

    if (this.user?.username && this.currentLang === 'en') {
      this.slugifiedUsername = this.stringToSlug(this.user.username);
    } else {
      this.slugifiedUsername = this.user?.username || null;
    }
  }

  // Convert string to slug
  stringToSlug(str: string): string {
    const from = "àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷÀÁÃẢẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆĐÙÚỦŨỤƯỪỨỬỮỰÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÌÍỈĨỊÄËÏÎÖÜÛÑÇÝỲỸỴỶ";
    const to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyyAAAAAAAAAAAAAAAAAEEEEEEEEEEEDUUUUUUUUUUUOOOOOOOOOOOOOOOOOIIIIIAEIOUUNCYYYYY";
    for (let i = 0, l = from.length; i < l; i++) {
      str = str.replace(RegExp(from[i], "g"), to[i]);
    }

    return str.trim();
  }

  loadFlights() {
    this.isLoading = true;
    this.flightService.getFlights({}).subscribe({
      next: (response) => {
        console.log('API response:', response);
        if (response.success && response.data) {
          this.flights = response.data;
          this.totalPages = Math.ceil(this.flights.length / this.pageSize);
          this.updateDisplayedFlights();
        } else {
          console.error('Invalid response format:', response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading flights:', error);
        this.isLoading = false;
      }
    });
  }

  // Update displayed flights based on current page
  updateDisplayedFlights() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.flights.length);
    this.displayedFlights = this.flights.slice(startIndex, endIndex);
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedFlights();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedFlights();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedFlights();
    }
  }

  // Helper method to generate page numbers array
  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  formatDisplayDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }

  formatDisplayTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  // Calculate flight duration
  getFlightDuration(flight: Flight): string {
    const departureTime = new Date(flight.departure.time);
    const arrivalTime = new Date(flight.arrival.time);

    const durationMs = arrivalTime.getTime() - departureTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}phút`;
  }

  // Get airport code from airport name
  getAirportCode(airportName: string): string {
    // Example mapping - you may need to implement a more complete solution
    const airportCodes: {[key: string]: string} = {
      'Sân bay Quốc tế Tân Sơn Nhất': 'SGN',
      'Sân bay Quốc tế Nội Bài': 'HAN',
      'Sân bay Quốc tế Đà Nẵng': 'DAD',
      'Sân bay Quốc tế Cam Ranh': 'CXR',
      'Sân bay Quốc tế Phú Quốc': 'PQC',
      'Sân bay Quốc tế Phú Bài': 'HUI',
      'Sân bay Liên Khương': 'DLI',
      'Sân bay Quốc tế Cát Bi': 'HPH',
      'Sân bay Vinh': 'VII',
      'Sân bay Quốc tế Cần Thơ': 'VCA',
      'Sân bay Phù Cát': 'UIH',
      'Sân bay Buôn Ma Thuột': 'BMV'
    };

    return airportCodes[airportName] || '';
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadLocations() {
    this.flightService.getLocations().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.locations = response.data.map((loc: Location) => loc.city);
          this.filteredDepartureLocations = [...this.locations];
          this.filteredDestinationLocations = [...this.locations];
        } else {
          console.error('Lỗi khi lấy danh sách địa điểm:', response.message);
        }
      },
      error: (error) => {
        console.error('Lỗi khi lấy danh sách địa điểm:', error);
      }
    });
  }

  filterDepartureLocations(value: string) {
    if (!value) {
      this.filteredDepartureLocations = [...this.locations];
      return;
    }

    const filterValue = value.toLowerCase();
    this.filteredDepartureLocations = this.locations.filter(location =>
      location.toLowerCase().includes(filterValue)
    );
  }

  filterDestinationLocations(value: string) {
    if (!value) {
      this.filteredDestinationLocations = [...this.locations];
      return;
    }

    const filterValue = value.toLowerCase();
    this.filteredDestinationLocations = this.locations.filter(location =>
      location.toLowerCase().includes(filterValue)
    );
  }

  selectDepartureLocation(location: string) {
    this.searchForm.get('departure')?.setValue(location);
    this.showDepartureDropdown = false;
  }


  selectDestinationLocation(location: string) {
    this.searchForm.get('destination')?.setValue(location);
    this.showDestinationDropdown = false;
  }

  logout(): void {
    this.authService.logout();
    this.user = null;
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'status-scheduled',
      'delayed': 'status-delayed',
      'cancelled': 'status-cancelled',
      'completed': 'status-completed'
    };
    return statusMap[status] || '';
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'scheduled': 'Đã lên lịch',
      'delayed': 'Bị hoãn',
      'cancelled': 'Đã hủy',
      'completed': 'Đã hoàn thành'
    };
    return statusMap[status] || status;
  }

  viewFlightDetails(flightId: string) {
    this.router.navigate(['/flights', flightId]);
  }

  onSearch(): void {
    if (this.searchForm.invalid) {
      Object.keys(this.searchForm.controls).forEach(key => {
        const control = this.searchForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const queryParams: any = {};

    Object.keys(this.searchForm.value).forEach(key => {
      const value = this.searchForm.value[key];
      if (value) {
        queryParams[key] = value;
      }
    });

    this.router.navigate(['/flights'], { queryParams });
  }

  @HostListener('document:click', ['$event'])
clickOutside(event: Event) {
  const target = event.target as HTMLElement;
  if (!target.closest('.departure-dropdown-container')) {
    this.showDepartureDropdown = false;
  }
  if (!target.closest('.destination-dropdown-container')) {
    this.showDestinationDropdown = false;
  }
}

  showDepartureDropdown = false;
  showDestinationDropdown = false;

  onFocusDeparture() {
    this.showDepartureDropdown = true;
    this.filterDepartureLocations(this.searchForm.get('departure')?.value || '');
  }

  onFocusDestination() {
    this.showDestinationDropdown = true;
    this.filterDestinationLocations(this.searchForm.get('destination')?.value || '');
  }

  goToProfile() {
    this.router.navigate(['/profile']);
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

  // Kiểm tra xem chuyến bay có khuyến mãi hay không
  hasPromotion(flight: Flight): boolean {
    return this.getPromotionsForFlight(flight).length > 0;
  }

  // Kiểm tra xem thời gian bay có nằm trong khoảng thời gian khuyến mãi
  isFlightInPromotionPeriod(flight: Flight, promotion: Promotion): boolean {
    const flightTime = new Date(flight.departure.time).getTime();
    const promotionStart = new Date(promotion.startDate).getTime();
    const promotionEnd = new Date(promotion.endDate).getTime();

    return flightTime >= promotionStart && flightTime <= promotionEnd;
  }

  // Lấy danh sách khuyến mãi áp dụng cho một chuyến bay
  getPromotionsForFlight(flight: Flight): Promotion[] {
    return this.promotions.filter(promotion =>
      promotion.isActive &&
      promotion.applicableFlights?.some(f => f._id === flight._id) &&
      this.isFlightInPromotionPeriod(flight, promotion)
    );
  }

  // Tính giá sau khi áp dụng khuyến mãi
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
}
