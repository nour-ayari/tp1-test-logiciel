import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { SignupRequestDto } from '../dto/signup-request.dto';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { APP_ROUTES } from '../../config/app-routes.confg';
import { strongPasswordValidator } from '../validators/strong-password.validator';
import { RouterLink } from '@angular/router';
import { emailExistsValidator } from '../validators/unique-email.validator';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  APP_ROUTES = APP_ROUTES;
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private formBuilder = inject(FormBuilder);

  showPass = signal(false);
  togglePass() {
    this.showPass.update((value) => !value);
  }

  isLoading = this.authService.loading;
  signupform = this.formBuilder.group({
    email: [
      '',
      {
        validators: [Validators.required, Validators.email],
        asyncValidators: [emailExistsValidator(this.authService)],
        updateOn: 'blur',
      },
    ],
    full_name: ['', [Validators.required]],
    password: [
      '',
      {
        validators: [Validators.required, Validators.minLength(8), strongPasswordValidator()],
        updateOn: 'blur',
      },
    ],
    date_of_birth: [''],
    profile_picture_url: [''],
    newsletter_subscribed: [''],
  });

  onSubmit() {
    if (this.signupform.valid) {
      const signupData: SignupRequestDto = this.signupform.value as SignupRequestDto;
      this.authService.signup(signupData).subscribe({
        next: (user) => {
          this.toastr.success(`User ${user.full_name} registered successfully`);
          this.router.navigate([APP_ROUTES.login]);
        },
        error: (err) => {
          this.toastr.error(`Une erreur s'est produite, Veuillez contacter l'admin`);
        },
      });
    }
  }
}
