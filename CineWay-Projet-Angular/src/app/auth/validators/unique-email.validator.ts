import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { debounceTime, switchMap, map, catchError, of, first } from 'rxjs';

export function emailExistsValidator(authService: AuthService): AsyncValidatorFn {
  return (control: AbstractControl) => {
    return of(control.value).pipe(
      debounceTime(400),
      switchMap((value) =>
        authService.checkEmailExists(value).pipe(
          map((exists) => (exists ? { emailExists: true } : null)),
          catchError(() => of(null))
        )
      ),
      first()
    );
  };
}
