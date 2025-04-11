import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { RouterModule } from '@angular/router';
import { Observable, catchError, throwError, map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';


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

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  providers: [NotificationService, HttpClient]
})
export class UserProfileComponent implements OnInit {
  user: any = null;
  isEditing = false;
  isChangingPassword = false;
  isSubmitting = false;
  isLoading = true;
  error: string | null = null;

  editForm!: FormGroup;
  passwordForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  private initializeForms() {
    this.editForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  loadUserProfile() {
    this.isLoading = true;
    this.error = null;

    if (!this.authService.isLoggedIn()) {
      this.error = 'Vui lòng đăng nhập để xem thông tin';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getProfile().subscribe({
      next: (response: any) => {
        console.log('Profile loaded:', response);
        
        // Xử lý response có thể nằm trong user hoặc trực tiếp
        const userData = response.user || response;
        
        if (userData && userData.email && userData.username) {
          this.user = userData;
          this.updateFormWithUserData();
        } else {
          this.error = 'Dữ liệu người dùng không hợp lệ';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Profile loading error:', error);
        this.isLoading = false;
        this.handleError(error);
      }
    });
  }

  onSubmitEdit() {
    if (this.editForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const userData = this.editForm.value;
  
      this.authService.updateProfile(userData).subscribe({
        next: (response: any) => {
          console.log('Profile updated:', response);
          // Cập nhật thông tin người dùng từ response
          this.user = response;
          this.isEditing = false;
          this.notificationService.showNotification('Cập nhật thông tin thành công');
          this.isSubmitting = false;
        },
        error: (error) => {
          this.isSubmitting = false;
          this.handleError(error);
        }
      });
    }
  }
  
  onSubmitPassword() {
    if (this.passwordForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const passwordData: PasswordChangeData = {
        currentPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value,
        confirmPassword: this.passwordForm.get('confirmPassword')?.value
      };
  
      this.authService.changePassword(passwordData).subscribe({
        next: (response) => {
          this.isChangingPassword = false;
          this.passwordForm.reset();
          this.notificationService.showNotification('Đổi mật khẩu thành công');
          this.isSubmitting = false;
          this.router.navigate(['/home']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.handleError(error);
        }
      });
    }
  }

  private handleError(error: any) {
    let message = 'Đã xảy ra lỗi';
    
    if (error.status === 401) {
      message = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
      this.authService.logout();
    } else if (error.status === 404) {
      message = 'Không tìm thấy thông tin người dùng';
    } else if (error.message) {
      message = error.message;
    }
    
    this.notificationService.showNotification(message);
  }

  private updateFormWithUserData() {
    if (this.user) {
      this.editForm.patchValue({
        email: this.user.email || '',
        username: this.user.username || ''
      }, { emitEvent: false });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.cancelEdit();
    }
  }

  togglePasswordChange(): void {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.passwordForm.reset();
    }
  }

  cancelEdit(): void {
    this.isEditing = false;
    if (this.user) {
      this.editForm.patchValue({
        email: this.user.email,
        username: this.user.username
      });
    }
  }

  // Thêm validation messages
  getErrorMessage(controlName: string): string {
    const control = this.passwordForm.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) {
        return 'Trường này là bắt buộc';
      }
      if (control.errors['minlength']) {
        return 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      if (control.errors['incorrect']) {
        return 'Mật khẩu hiện tại không đúng';
      }
      if (controlName === 'confirmPassword' && control.errors['matching']) {
        return 'Mật khẩu xác nhận không khớp';
      }
    }
    return '';
  }
}