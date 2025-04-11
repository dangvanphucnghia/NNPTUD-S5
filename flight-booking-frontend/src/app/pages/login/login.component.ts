import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  providers: [HttpClient],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private apiUrl = 'http://localhost:8000/v1/auth/login';
  constructor(private http: HttpClient,private authService: AuthService, private router: Router) {}

  getFlights(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
  user = { email: '', password: '' };
  errorMessage: string = '';
  onLogin() {
    this.authService.login(this.user).subscribe(
      response => {
        console.log('Đăng nhập thành công:', response);
        
        // Kiểm tra xem người dùng có phải là admin không
        const isAdmin = response.user.roles && 
                      response.user.roles.includes('admin');
        
        if (isAdmin) {
          // Nếu là admin, hiển thị thông báo lỗi
          this.errorMessage = 'Tài khoản admin không được phép đăng nhập tại đây. Vui lòng sử dụng trang đăng nhập dành cho quản trị viên.';
        } else {
          // Nếu là user thông thường, cho phép đăng nhập
          this.authService.saveUserData(
            response.token, 
            response.user.username, 
            'user'
          );
          this.router.navigate(['/home']);
        }
      },
      error => {
        console.error('Lỗi đăng nhập:', error);
        this.errorMessage = 'Sai email hoặc mật khẩu!';
      }
    );
  }
  
  togglePasswordVisibility(passwordInput: HTMLInputElement) {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
    } else {
      passwordInput.type = 'password';
    }
  }
}