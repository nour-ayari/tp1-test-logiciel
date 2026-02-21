import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function strongPasswordValidator(): ValidatorFn {
return(control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string;
  if (!value) return null;

  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

  const isValid = hasUpper && hasLower && hasNumber && hasSpecial;

  return isValid ? null : { weakPassword: true };
};
}
