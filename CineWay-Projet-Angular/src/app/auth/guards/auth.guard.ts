import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { APP_ROUTES } from '../../config/app-routes.confg';
import { ToastrService } from 'ngx-toastr';
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  if (!authService.isAuthenticated()) {
    toastr.info('You should log in first.');
    router.navigate([APP_ROUTES.login]);
    return false;
  }
  return true;
};
