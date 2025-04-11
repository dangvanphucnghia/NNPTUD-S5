import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  providers: [HttpClient],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent {
  private apiUrl = 'http://localhost:8000/v1/auth/login';
  
  constructor(
    private http: HttpClient,
    private authService: AuthService, 
    private router: Router
  ) {}

  admin = { email: '', password: '' };
  errorMessage: string = '';

  onLogin() {
    this.authService.login(this.admin).subscribe(
      response => {
        console.log('Đăng nhập thành công:', response);
        
        // Kiểm tra role từ response
        const isAdmin = response.user && 
                       (response.user.role === 'admin' || 
                        (response.user.roles && response.user.roles.includes('admin')));
        
        if (isAdmin) {
          // Lưu thông tin người dùng với vai trò admin
          this.authService.saveUserData(
            response.token, 
            response.user.username, 
            'admin'
          );
          
          // Chuyển hướng đến dashboard với đường dẫn đúng
          this.router.navigate(['/admin/dashboard']);
        } else {
          // Nếu không phải admin, hiển thị thông báo lỗi
          this.errorMessage = 'Tài khoản này không có quyền quản trị!';
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