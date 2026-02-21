import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserApi } from '../../../../services/user-api';

@Component({
  selector: 'app-add-edit-user-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-edit-user-page.html',
  styleUrls: ['./add-edit-user-page.css'],
})
export class AddEditUserPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private usersApi = inject(UserApi);
  private destroyRef = inject(DestroyRef);

  isEditMode = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  userId = signal<number | null>(null);

  form!: FormGroup;

  ngOnInit() {
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      full_name: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  private checkEditMode() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.userId.set(parseInt(id, 10));
      this.loadUser(parseInt(id, 10));
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.get('password')?.updateValueAndValidity();
    }
  }

  private loadUser(id: number) {
    this.loading.set(true);
    this.usersApi
      .getUserById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.form.patchValue(user);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load user');
          this.loading.set(false);
        },
      });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.loading.set(true);
    const userData = this.prepareUserData();

    const request = this.isEditMode()
      ? this.usersApi.updateUser(this.userId()!, userData)
      : this.usersApi.createUser(userData);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/users']);
      },
      error: (err) => {
        this.error.set(err?.error?.detail || 'Failed to save user');
        this.loading.set(false);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/admin/users']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) return `${fieldName} is required`;
    if (control.errors['minlength']) {
      return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['email']) return 'Please enter a valid email';

    return 'Invalid field';
  }

  private prepareUserData() {
    const formData = { ...this.form.value };
    if (this.isEditMode() || !formData.password) {
      delete formData.password;
    }
    return formData;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
