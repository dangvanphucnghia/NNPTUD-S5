// src/app/services/ticket.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = 'http://localhost:8000/v1/tickets'; // Cập nhật đường dẫn API đúng
  private paymentApiUrl = 'http://localhost:8000/api/payment';

  constructor(private http: HttpClient) { }

  // Book flight tickets
  bookTicket(flightId: string, tickets: any[], totalDiscountedPrice: number): Observable<any> {
    let token = localStorage.getItem('token');
    if (token && token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.post(`${this.apiUrl}/book_and_pay`, {
      flightId,
      tickets,
      discountedPrice: totalDiscountedPrice // Gửi giá đã giảm lên server
    }, { headers });
  }

  // Get user tickets
  getUserTickets(): Observable<any> {
    let token = localStorage.getItem('token');
    if (token && token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }
    
    console.log('Token for getting tickets:', token);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Cập nhật để lấy data từ response
    return this.http.get(`${this.apiUrl}/user`, { headers });
  }

  // Thêm phương thức kiểm tra token
  verifyToken(): Observable<any> {
    let token = localStorage.getItem('token');
    if (token && token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get('http://localhost:8000/v1/auth/profile', { headers });
  }

  // Lấy thông tin thanh toán
  getPaymentStatus(paymentId: string): Observable<any> {
    let token = localStorage.getItem('token');
    if (token && token.startsWith('"') && token.endsWith('"')) {
      token = token.slice(1, -1);
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.paymentApiUrl}/status/${paymentId}`, { headers });
  }
}