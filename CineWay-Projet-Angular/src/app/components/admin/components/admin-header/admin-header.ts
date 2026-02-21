import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { UserApi } from '../../../../services/user-api';

@Component({
  selector: 'app-admin-header',
  imports: [],
  templateUrl: './admin-header.html',
  styleUrl: './admin-header.css',
})
export class AdminHeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastrService = inject(ToastrService);
  userApi = inject(UserApi);

  user = this.userApi.user;
  menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.toastrService.warning('Good bye!');
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }
}
