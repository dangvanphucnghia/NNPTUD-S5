import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
  isSidebarCollapsed = false;
  username: string = 'admin'; // Explicit type declaration
  isMobileView = false;

  constructor(private router: Router) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Get username from localStorage or service when component initializes
    const storedUsername = localStorage.getItem('adminUsername');
    if (storedUsername) {
      this.username = storedUsername;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobileView = window.innerWidth < 1024;
    if (this.isMobileView) {
      this.isSidebarCollapsed = true;
    } else {
      this.isSidebarCollapsed = false;
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUsername');
    this.router.navigate(['/admin/login']);
  }
} 