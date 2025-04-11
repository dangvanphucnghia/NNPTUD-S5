import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterModule, CommonModule],
  providers: [HttpClient],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  user = {
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  };
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister() {
    // Kiểm tra mật khẩu nhập lại có khớp không
    if (this.user.password !== this.user.confirmPassword) {
      this.errorMessage = 'Mật khẩu xác nhận không trùng khớp!';
      return;
    }

    // Gửi dữ liệu đăng ký
    this.authService.register(this.user).subscribe({
      next: (response) => {
        console.log('Đăng ký thành công:', response);
        this.router.navigate(['/login']); // ✅ Lưu user và chuyển hướng
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Đăng ký thất bại. Vui lòng thử lại!';
        console.error('Lỗi đăng ký:', err);
      }
    });
  }
}
