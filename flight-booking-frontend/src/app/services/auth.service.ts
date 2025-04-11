import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError, map } from 'rxjs';
import { tap } from 'rxjs/operators';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  roles: string[];
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'

})
export class AuthService {
  private apiUrl = 'http://localhost:8000/v1/auth'; // API backend

  constructor(private http: HttpClient, private router: Router) { }

  register(user: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, user);
  }

  // Đăng nhập
  login(user: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, user);
  }
  saveUserData(token: string, username: string, role?: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);

    // Save the role if provided, otherwise default to 'user'
    localStorage.setItem('userRole', role || 'user');
  }

  getUserInfo(): string | null {
    return localStorage.getItem('username');
  }

  getUserRole(): string {
    return localStorage.getItem('userRole') || 'user';
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
  }














  // Đảm bảo sửa đúng và đầy đủ cú pháp trong các phương thức này
  getProfile(): Observable<UserProfile> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No authentication token'));
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`);

    return this.http.get<UserProfile>(`${this.apiUrl}/profile`, { headers }).pipe(
      map((response: any) => {
        if (!response) {
          throw new Error('Không tìm thấy thông tin người dùng');
        }
        const userData = response.user || response;
        return userData as UserProfile;
      }),
      tap((userData: UserProfile) => {
        console.log('Profile Response:', userData);
      }),
      catchError((error) => this.handleError(error))
    );
  }

  updateProfile(userData: any): Observable<UserProfile> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No authentication token'));
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`);

    return this.http.put<UserProfile>(`${this.apiUrl}/update`, userData, { headers }).pipe(
      map((response: any) => {
        if (response.user) {
          if (response.user.username) {
            localStorage.setItem('username', response.user.username);
          }
          return response.user as UserProfile;
        }
        return response as UserProfile;
      }),
      catchError(error => {
        console.error('Update Profile Error:', error);
        return throwError(() => ({
          status: error.status,
          message: error.error?.message || 'Không thể cập nhật thông tin'
        }));
      })
    );
  }
  private getToken(): string | null {
    return localStorage.getItem('token');
  }
  changePassword(passwordData: PasswordChangeData): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No authentication token'));
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`);

    // Thêm username vào request theo yêu cầu của backend
    const data = {
      username: localStorage.getItem('username'),
      oldPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    };

    return this.http.post(`${this.apiUrl}/change-password`, data, { headers }).pipe(
      tap((response: any) => {
        console.log('Password Change Response:', response);
      }),
      catchError(error => {
        console.error('Change Password Error:', error);
        return throwError(() => ({
          status: error.status,
          message: error.error?.message || 'Không thể đổi mật khẩu'
        }));
      })
    );
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    let errorMessage = 'Đã xảy ra lỗi';

    if (error.error instanceof ErrorEvent) {
      // Lỗi phía client
      errorMessage = error.error.message;
    } else {
      // Lỗi phía server
      if (error.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
        // Không thể gọi this.logout() vì không có this trong context này
        // Giải pháp khác: trả về loại lỗi để xử lý ở nơi gọi
      } else if (error.status === 404) {
        // Kiểm tra xem có phải là lỗi 404 thực sự không
        console.log('Error details:', error.error);
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = 'Không thể cập nhật thông tin. Vui lòng thử lại sau.';
        }
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }
    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      error: error.error
    }));
  }

}
