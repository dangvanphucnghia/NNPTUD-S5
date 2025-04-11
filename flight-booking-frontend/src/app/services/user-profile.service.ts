import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private apiUrl = 'http://localhost:8000/v1/auth/profile'; // Địa chỉ API backend

  constructor(private http: HttpClient) {}

  getUserProfile(): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }
}
