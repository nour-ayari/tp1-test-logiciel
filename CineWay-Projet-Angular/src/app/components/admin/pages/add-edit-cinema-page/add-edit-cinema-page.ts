import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Cinema } from '../../../../models/cinema.model';
import { CinemaService } from '../../../../services/cinema.service';

@Component({
  selector: 'app-add-edit-cinema-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-edit-cinema-page.html',
  styleUrls: ['./add-edit-cinema-page.css'],
})
export class AddEditCinemaPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private cinemasApi = inject(CinemaService);
  private destroyRef = inject(DestroyRef);

  isEditMode = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  cinemaId = signal<number | null>(null);

  form!: FormGroup;

  amenityOptions = [
    'Wheelchair Accessible',
    'Parking Available',
    'Food & Beverage',
    'Luxury Seating',
    'IMAX Screen',
    'Dolby Atmos',
    'Reserved Seating',
    'VIP Lounge',
  ];

  ngOnInit() {
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', Validators.required],
      amenities: [''],
    });
  }

  private checkEditMode() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.cinemaId.set(parseInt(id, 10));
      this.loadCinema(parseInt(id, 10));
    }
  }

  private loadCinema(id: number) {
    this.loading.set(true);
    this.cinemasApi
      .getCinemaById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cinema: Cinema) => {
          this.form.patchValue(cinema);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load cinema');
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
    const cinemaData: Partial<Cinema> = this.form.value;

    const request = this.isEditMode()
      ? this.cinemasApi.updateCinema(this.cinemaId()!, cinemaData)
      : this.cinemasApi.createCinema(cinemaData);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/cinemas']);
      },
      error: (err) => {
        this.error.set('Failed to save cinema');
        this.loading.set(false);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/admin/cinemas']);
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
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
    if (control.errors['max']) return `Maximum value is ${control.errors['max'].max}`;

    return 'Invalid field';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
