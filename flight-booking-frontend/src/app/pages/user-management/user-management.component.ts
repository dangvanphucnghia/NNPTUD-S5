import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

interface User {
  _id: string;
  username: string;
  email: string;
  admin: boolean;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  isEditing = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  isLoading = false;
  userForm: FormGroup;
  private apiUrl = 'http://localhost:8000/v1/users';

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/admin/login']);
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadUsers() {
    this.isLoading = true;
    const headers = this.getHeaders();
    this.http.get<{users: User[], total: number}>(this.apiUrl, { headers })
      .subscribe({
        next: (response) => {
          if (response && response.users) {
            this.users = response.users.filter(user => !user.admin);
            this.errorMessage = '';
          } else {
            this.errorMessage = 'Dữ liệu không hợp lệ';
            console.error('Invalid response format:', response);
          }
          this.isLoading = false;
        },
        error: (error) => {
          if (error.status === 401) {
            this.router.navigate(['/admin/login']);
          } else {
            this.errorMessage = 'Không thể tải danh sách người dùng';
            console.error('Error loading users:', error);
          }
          this.isLoading = false;
        }
      });
  }

  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users;
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(user => 
      user.username.toLowerCase().includes(term)
    );
  }

  createUser() {
    this.userForm.reset();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.selectedUser = null;
    this.isEditing = true;
  }

  editUser(user: User) {
    this.selectedUser = { ...user };
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      password: ''
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.isEditing = true;
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.errorMessage = 'Vui lòng kiểm tra lại thông tin nhập vào';
      return;
    }

    const headers = this.getHeaders();
    const userData: any = {
      username: this.userForm.get('username')?.value,
      email: this.userForm.get('email')?.value
    };

    const password = this.userForm.get('password')?.value;
    if (password && password.trim()) {
      userData.password = password;
    }

    if (this.selectedUser?._id) {
      this.isLoading = true;
      this.http.put(
        `${this.apiUrl}/${this.selectedUser._id}`,
        userData,
        { headers }
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Cập nhật thông tin người dùng thành công';
          this.loadUsers();
          this.isEditing = false;
          this.selectedUser = null;
          this.isLoading = false;
        },
        error: (error) => {
          if (error.status === 401) {
            this.router.navigate(['/admin/login']);
          } else {
            this.errorMessage = error.error?.message || 'Không thể cập nhật thông tin người dùng';
            console.error('Error updating user:', error);
          }
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = true;
      this.http.post(
        this.apiUrl,
        { ...userData, password: this.userForm.get('password')?.value },
        { headers }
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Thêm người dùng mới thành công';
          this.loadUsers();
          this.isEditing = false;
          this.selectedUser = null;
          this.isLoading = false;
        },
        error: (error) => {
          if (error.status === 401) {
            this.router.navigate(['/admin/login']);
          } else {
            this.errorMessage = error.error?.message || 'Không thể thêm người dùng mới';
            console.error('Error creating user:', error);
          }
          this.isLoading = false;
        }
      });
    }
  }

  deleteUser(userId: string) {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      this.isLoading = true;
      const headers = this.getHeaders();
      this.http.delete(
        `${this.apiUrl}/${userId}`,
        { headers }
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Xóa người dùng thành công';
          this.loadUsers();
          this.isLoading = false;
        },
        error: (error) => {
          if (error.status === 401) {
            this.router.navigate(['/admin/login']);
          } else {
            this.errorMessage = 'Không thể xóa người dùng';
            console.error('Error deleting user:', error);
          }
          this.isLoading = false;
        }
      });
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedUser = null;
    this.userForm.reset();
  }

  getErrorMessage(controlName: string): string {
    const control = this.userForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Trường này là bắt buộc';
    }
    if (control?.hasError('email')) {
      return 'Email không hợp lệ';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      if (controlName === 'password' && !this.selectedUser?._id) {
        return `Mật khẩu phải có ít nhất ${minLength} ký tự`;
      }
      return `Độ dài tối thiểu là ${minLength} ký tự`;
    }
    if (control?.hasError('maxlength')) {
      return `Độ dài tối đa là ${control.errors?.['maxlength'].requiredLength} ký tự`;
    }
    return '';
  }
}
