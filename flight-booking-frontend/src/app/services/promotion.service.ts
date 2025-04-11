import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';


// Define the ApiResponse interface
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
  count?: number;
}

// Define the Promotion interface based on backend model
export interface Promotion {
  _id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount?: number;
  applicableFlights?: any[];
  applicableAirlines?: any[];
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
    private apiUrl = 'http://localhost:8000/v1/promotions';

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/admin/login']);
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    if (error.status === 401) {
      console.log('Unauthorized access, redirecting to login');
      localStorage.removeItem('admin_token');
      this.router.navigate(['/admin/login']);
    }
    return throwError(() => error);
  }

  // Lấy danh sách khuyến mãi
  getAllPromotions(): Observable<ApiResponse<Promotion[]>> {
    return this.http.get<ApiResponse<Promotion[]>>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Lấy chi tiết khuyến mãi
  getPromotion(id: string): Observable<ApiResponse<Promotion>> {
    return this.http.get<ApiResponse<Promotion>>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Tạo khuyến mãi mới
  createPromotion(promotion: Partial<Promotion>): Observable<ApiResponse<Promotion>> {
    return this.http.post<ApiResponse<Promotion>>(this.apiUrl, promotion, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Cập nhật khuyến mãi
  updatePromotion(id: string, promotion: Partial<Promotion>): Observable<ApiResponse<Promotion>> {
    return this.http.put<ApiResponse<Promotion>>(`${this.apiUrl}/${id}`, promotion, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Xóa khuyến mãi
  deletePromotion(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // Kiểm tra mã khuyến mãi
  validatePromotionCode(code: string, amount: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/validate`, { code, amount }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError.bind(this)));
  }
} 