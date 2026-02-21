import { Component, effect, EventEmitter, inject, Input, Output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserApi } from '../../../services/user-api';
import { Profile } from '../../../models/profile.model';
import { PaymentHistory } from '../../payment/history/history';
import { ContactComponent } from '../../contact/contact.component';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-content',
  imports: [ReactiveFormsModule, PaymentHistory, ContactComponent],
  templateUrl: './content.html',
  styleUrl: './content.css',
})
export class Content {
  private fb = inject(FormBuilder);
  private userApi = inject(UserApi);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  profile = this.userApi.profile;

  @Input() section!: 'profile' | 'payment' | 'history' | 'help' | 'preferences';

  @Output() updateProfile = new EventEmitter<{
    payload: Partial<Profile>;
    emailChanged: boolean;
  }>();
  @Output() uploadProfilePicture = new EventEmitter<File>();
  @Output() accountDeleted = new EventEmitter<void>();

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  imageSizeClass =
    'w-32 h-32 rounded-full object-cover border border-gray-600 cursor-pointer transition-all duration-300 hover:scale-105';

  profileForm = this.fb.nonNullable.group({
    full_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  passwordForm = this.fb.nonNullable.group(
    {
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  constructor() {
    effect(() => {
      const p = this.profile();
      if (!p) return;

      this.profileForm.patchValue({
        full_name: p.full_name,
        email: p.email,
      });
    });
  }

  private passwordsMatchValidator(control: AbstractControl) {
    const newPassword = control.get('new_password')?.value;
    const confirm = control.get('confirm_new_password')?.value;
    if (!newPassword || !confirm) return null;
    return newPassword === confirm ? null : { passwordMismatch: true };
  }

  onSave() {
    if (this.profileForm.invalid || this.profileForm.pristine) return;

    const payload = this.profileForm.getRawValue();
    const currentProfile = this.profile();

    const emailChanged = !!currentProfile && payload.email !== currentProfile.email;

    this.updateProfile.emit({
      payload,
      emailChanged,
    });

    this.profileForm.markAsPristine();
  }
  onPictureSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.selectedFile = file;

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset the input
    input.value = '';
  }

  onUploadPicture() {
    if (this.selectedFile) {
      this.uploadProfilePicture.emit(this.selectedFile);
      this.selectedFile = null;
      this.previewUrl = null;
    }
  }

  toggleImageSize() {
    if (this.imageSizeClass.includes('w-32')) {
      this.imageSizeClass =
        'w-48 h-48 rounded-full object-cover border border-gray-600 cursor-pointer transition-all duration-300 hover:scale-105';
    } else {
      this.imageSizeClass =
        'w-32 h-32 rounded-full object-cover border border-gray-600 cursor-pointer transition-all duration-300 hover:scale-105';
    }
  }

  onDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.userApi.deleteAccount().subscribe({
        next: () => {
          this.toastr.success('Account deleted successfully');
          this.accountDeleted.emit();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error deleting account:', error);
          this.toastr.error('Failed to delete account. Please try again.');
        },
      });
    }
  }

  passwordMatchValidator(form: any) {
    const newPassword = form.get('new_password');
    const confirmPassword = form.get('confirm_password');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onChangePassword() {
    if (this.passwordForm.invalid) {
      this.toastr.error('Please fill in all fields correctly');
      return;
    }

    const formValue = this.passwordForm.value;
    const current_password = formValue.current_password || '';
    const new_password = formValue.new_password || '';

    this.authService.changePassword({ current_password, new_password }).subscribe({
      next: (response) => {
        this.toastr.success(response.message || 'Password changed successfully');
        this.passwordForm.reset();
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.toastr.error(error.error?.message || 'Failed to change password. Please try again.');
      },
    });
  }
}
