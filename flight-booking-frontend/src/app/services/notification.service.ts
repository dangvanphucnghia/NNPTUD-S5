import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = 'http://localhost:8000/v1/notifications';

  constructor(private http: HttpClient) {}

  getMyNotifications(): Observable<any> {
    const token = localStorage.getItem('token'); // lấy token từ localStorage
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(this.apiUrl, { headers });
  }

  showNotification(message: string) {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
}