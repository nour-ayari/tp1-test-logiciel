import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-sidebar',

  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.css',
})
export class AdminSidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastrService = inject(ToastrService);

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.toastrService.warning('Good bye!');
    
  }
}
