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
export class AirlineService {
  private apiUrl = 'http://localhost:8000/v1/airlines';

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
      this.router.navigate(['/admin/login']);
    }
    return throwError(() => error);
  }

  // Lấy tất cả hãng bay (bao gồm đã xóa nếu includeDeleted=true)
  getAllAirlines(includeDeleted: boolean = false): Observable<ApiResponse> {
    const params = new HttpParams().set('includeDeleted', includeDeleted.toString());
    return this.http.get<ApiResponse>(this.apiUrl, { 
      headers: this.getHeaders(),
      params: params
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Lấy chi tiết một hãng bay
  getAirlineById(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Tạo hãng bay mới
  createAirline(airlineData: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.apiUrl, airlineData, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Cập nhật thông tin hãng bay
  updateAirline(id: string, airlineData: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.apiUrl}/${id}`, airlineData, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Xóa mềm hãng bay
  deleteAirline(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Khôi phục hãng bay đã xóa
  restoreAirline(id: string): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>(`${this.apiUrl}/${id}/restore`, {}, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }
}