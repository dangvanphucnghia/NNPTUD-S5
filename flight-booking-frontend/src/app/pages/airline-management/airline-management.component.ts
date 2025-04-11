import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AirlineService } from '../../services/airline.service';

interface Airline {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  description?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-airline-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './airline-management.component.html',
  styleUrls: ['./airline-management.component.scss']
})
export class AirlineManagementComponent implements OnInit {
  airlines: Airline[] = [];
  selectedAirline: Airline | null = null;
  isEditing = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  isLoading = false;
  showDeleted = false;
  airlineForm: FormGroup;

  constructor(
    private airlineService: AirlineService,
    private router: Router,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.airlineForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      logo: [''],
      description: ['']
    });

    this.airlineForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      logo: ['', [Validators.pattern('^(http|https)://.*$')]], // Thêm pattern validator
      description: ['']
    });
  }

  ngOnInit() {
    this.loadAirlines();
  }

  getLogoUrl(logo: string): SafeUrl {
    if (!logo) return '';
    
    // Luôn trả về URL trực tiếp, không cần xử lý đường dẫn local
    return this.sanitizer.bypassSecurityTrustUrl(logo);
  }

  loadAirlines() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.airlineService.getAllAirlines(this.showDeleted).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.airlines = response.data;
          this.errorMessage = '';
        } else {
          this.errorMessage = response.message || 'Dữ liệu không hợp lệ';
          console.error('Invalid response format:', response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể tải danh sách hãng bay';
        console.error('Error loading airlines:', error);
        this.isLoading = false;
      }
    });
  }

  get filteredAirlines(): Airline[] {
    if (!this.searchTerm) return this.airlines;
    const term = this.searchTerm.toLowerCase();
    return this.airlines.filter(airline => 
      airline.name.toLowerCase().includes(term) ||
      airline.code.toLowerCase().includes(term)
    );
  }

  createAirline() {
    this.airlineForm.reset();
    this.selectedAirline = null;
    this.isEditing = true;
  }

  editAirline(airline: Airline) {
    this.selectedAirline = { ...airline };
    this.airlineForm.patchValue({
      name: airline.name,
      code: airline.code,
      logo: airline.logo || '',
      description: airline.description || ''
    });
    this.isEditing = true;
  }

  saveAirline() {
    if (this.airlineForm.invalid) {
      this.errorMessage = 'Vui lòng kiểm tra lại thông tin nhập vào';
      return;
    }

    const airlineData = this.airlineForm.value;
    this.isLoading = true;

    const saveObservable = this.selectedAirline
      ? this.airlineService.updateAirline(this.selectedAirline._id, airlineData)
      : this.airlineService.createAirline(airlineData);

    saveObservable.subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = this.selectedAirline
            ? 'Cập nhật thông tin hãng bay thành công'
            : 'Thêm hãng bay mới thành công';
          this.loadAirlines();
          this.isEditing = false;
          this.selectedAirline = null;
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.errorMessage = response.message || 'Không thể lưu thông tin hãng bay';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể lưu thông tin hãng bay';
        console.error('Error saving airline:', error);
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  deleteAirline(id: string) {
    if (confirm('Bạn có chắc chắn muốn xóa hãng bay này?')) {
      this.isLoading = true;
      this.airlineService.deleteAirline(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Xóa hãng bay thành công';
            this.loadAirlines();
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            this.errorMessage = response.message || 'Không thể xóa hãng bay';
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Không thể xóa hãng bay';
          console.error('Error deleting airline:', error);
          this.isLoading = false;
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  restoreAirline(id: string) {
    this.isLoading = true;
    this.airlineService.restoreAirline(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Khôi phục hãng bay thành công';
          this.loadAirlines();
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.errorMessage = response.message || 'Không thể khôi phục hãng bay';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Không thể khôi phục hãng bay';
        console.error('Error restoring airline:', error);
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  toggleDeletedAirlines() {
    this.showDeleted = !this.showDeleted;
    this.loadAirlines();
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedAirline = null;
    this.airlineForm.reset();
  }

  getErrorMessage(controlName: string): string {
    const control = this.airlineForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Trường này là bắt buộc';
    }
    if (control?.hasError('minlength')) {
      return `Độ dài tối thiểu là ${control.errors?.['minlength'].requiredLength} ký tự`;
    }
    if (control?.hasError('maxlength')) {
      return `Độ dài tối đa là ${control.errors?.['maxlength'].requiredLength} ký tự`;
    }
    return '';
  }
} 