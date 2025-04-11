import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

interface ApiResponse {
  success: boolean;
  data: any;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private apiUrl = 'http://localhost:8000/v1/flights';

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
    if (error.status === 401) {
      localStorage.removeItem('token');
      this.router.navigate(['/admin/login']);
    }
    return throwError(() => error);
  }

  // Lấy danh sách chuyến bay với phân trang và filter
  getFlights(params: any): Observable<ApiResponse> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http.get<ApiResponse>(this.apiUrl, { 
      headers: this.getHeaders(),
      params: httpParams 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Lấy tất cả chuyến bay (bao gồm đã xóa nếu includeDeleted=true)
  getAllFlights(includeDeleted: boolean = false): Observable<ApiResponse> {
    const params = new HttpParams().set('includeDeleted', includeDeleted.toString());
    return this.http.get<ApiResponse>(`${this.apiUrl}/all`, { 
      headers: this.getHeaders(),
      params: params
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Lấy chi tiết một chuyến bay
  getFlightById(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Tạo chuyến bay mới
  createFlight(flightData: any): Observable<ApiResponse> {
    // Ensure dates are properly formatted
    if (flightData.departure && flightData.departure.time) {
      // No need to modify if it's already a string in ISO format
      if (flightData.departure.time instanceof Date) {
        flightData.departure.time = flightData.departure.time.toISOString();
      }
    }
    
    if (flightData.arrival && flightData.arrival.time) {
      // No need to modify if it's already a string in ISO format
      if (flightData.arrival.time instanceof Date) {
        flightData.arrival.time = flightData.arrival.time.toISOString();
      }
    }

    // If airline is not provided, we'll let the backend find the first available airline
    if (!flightData.airline) {
      console.warn('No airline specified for flight. Backend will use the first available airline.');
    }

    return this.http.post<ApiResponse>(this.apiUrl, flightData, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Cập nhật thông tin chuyến bay
  updateFlight(id: string, flightData: any): Observable<ApiResponse> {
    // Ensure dates are properly formatted
    if (flightData.departure && flightData.departure.time) {
      // No need to modify if it's already a string in ISO format
      if (flightData.departure.time instanceof Date) {
        flightData.departure.time = flightData.departure.time.toISOString();
      }
    }
    
    if (flightData.arrival && flightData.arrival.time) {
      // No need to modify if it's already a string in ISO format
      if (flightData.arrival.time instanceof Date) {
        flightData.arrival.time = flightData.arrival.time.toISOString();
      }
    }

    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, flightData, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Xóa mềm chuyến bay
  deleteFlight(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Khôi phục chuyến bay đã xóa
  restoreFlight(id: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/restore`, {}, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Lấy danh sách địa điểm
  getLocations(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/locations`).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}