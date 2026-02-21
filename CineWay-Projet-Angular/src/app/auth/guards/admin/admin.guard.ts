import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserApi } from '../../../services/user-api';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userApi = inject(UserApi);
 

  const user = userApi.user();
  
  
  if (user && user.is_admin) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
