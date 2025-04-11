import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8000/v1'; // Use environment variable in production

  constructor(private http: HttpClient) { }

  /**
   * Get all users (admin only)
   */
  getAllUsers(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/users`, { headers });
  }

  /**
   * Get user by ID (admin only)
   */
  getUserById(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/users/${id}`, { headers });
  }

  /**
   * Create a new user (admin only)
   */
  createUser(userData: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.apiUrl}/users`, userData, { headers });
  }

  /**
   * Update user (admin only)
   */
  updateUser(id: string, userData: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put(`${this.apiUrl}/users/${id}`, userData, { headers });
  }

  /**
   * Delete user (admin only)
   */
  deleteUser(id: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.delete(`${this.apiUrl}/users/${id}`, { headers });
  }

  /**
   * Get total number of users
   */
  getUserCount(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/users`, { headers });
  }
} 