import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { APP_ROUTES } from '../../config/app-routes.confg';
import { ToastrService } from 'ngx-toastr';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  if (authService.isAuthenticated()) {
    toastr.info('You are already logged in.');
    router.navigate([APP_ROUTES.home]);
    return false;
  }
  return true;
};
