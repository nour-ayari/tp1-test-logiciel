import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MovieModel } from '../../../../models/movie.model';
import { MoviesApi } from '../../../../services/movies-api';

@Component({
  selector: 'app-add-edit-movie-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-edit-movie-page.html',
  styleUrls: ['./add-edit-movie-page.css'],
})
export class AddEditMoviePageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private moviesApi = inject(MoviesApi);
  private destroyRef = inject(DestroyRef);

  isEditMode = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  movieId = signal<number | null>(null);

  form!: FormGroup;

  genreOptions = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Sci-Fi',
    'Romance',
    'Thriller',
    'Animation',
    'Adventure',
    'Fantasy',
  ];

  ngOnInit() {
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      release_date: ['', Validators.required],
      duration_minutes: ['', [Validators.required, Validators.min(1)]],
      genre: ['', Validators.required],
      rating: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
      state: ['SHOWING', Validators.required],
      cast: this.fb.array([]),
      director: ['', Validators.required],
      writers: [''],
      producers: [''],
      country: ['', Validators.required],
      language: ['', Validators.required],
      budget: [''],
      revenue: [''],
      production_company: [''],
      distributor: [''],
      image_url: [''],
      trailer_url: [''],
      awards: [''],
      details: [''],
    });

    // Add at least one empty cast member for new movies
    if (!this.isEditMode()) {
      this.addCastMember();
    }
  }

  get castFormArray(): FormArray {
    return this.form.get('cast') as FormArray;
  }

  addCastMember() {
    const castGroup = this.fb.group({
      name: ['', Validators.required],
      image_url: [''],
    });
    this.castFormArray.push(castGroup);
  }

  removeCastMember(index: number) {
    this.castFormArray.removeAt(index);
  }

  private atLeastOneGenreValidator(control: any): { [key: string]: any } | null {
    if (!control.value || !Array.isArray(control.value) || control.value.length === 0) {
      return { required: true };
    }
    return null;
  }

  private checkEditMode() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.movieId.set(parseInt(id, 10));
      this.loadMovie(parseInt(id, 10));
    }
  }

  private loadMovie(id: number) {
    this.loading.set(true);
    this.moviesApi
      .getMovieById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (movie) => {
          // Convert cast array to FormArray
          this.castFormArray.clear();
          if (Array.isArray(movie.cast) && movie.cast.length > 0) {
            movie.cast.forEach((castMember: any) => {
              const castGroup = this.fb.group({
                name: [castMember.name || ''],
                image_url: [castMember.image_url || ''],
              });
              this.castFormArray.push(castGroup);
            });
          } else {
            // Add at least one empty cast member for new movies or movies without cast
            this.addCastMember();
          }

          // Convert arrays to comma-separated strings for form
          const writersString = Array.isArray(movie.writers)
            ? movie.writers.join(', ')
            : movie.writers;
          const producersString = Array.isArray(movie.producers)
            ? movie.producers.join(', ')
            : movie.producers;
          const awardsString = Array.isArray(movie.awards) ? movie.awards.join(', ') : movie.awards;

          // Convert details object to JSON string for form
          const detailsString = movie.details ? JSON.stringify(movie.details, null, 2) : '';

          this.form.patchValue({
            title: movie.title,
            description: movie.description,
            release_date: movie.release_date,
            duration_minutes: movie.duration_minutes,
            genre: Array.isArray(movie.genre) ? movie.genre[0] : movie.genre,
            rating: movie.rating,
            state: movie.state,
            director: movie.director,
            writers: writersString,
            producers: producersString,
            country: movie.country,
            language: movie.language,
            budget: movie.budget,
            revenue: movie.revenue,
            production_company: movie.production_company,
            distributor: movie.distributor,
            image_url: movie.image_url,
            trailer_url: movie.trailer_url,
            awards: awardsString,
            details: detailsString,
          });
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load movie');
          this.loading.set(false);
        },
      });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    // Additional validation for cast
    if (this.castFormArray.length === 0) {
      this.error.set('At least one cast member is required');
      return;
    }

    // Check if all cast members have names
    const invalidCast = this.castFormArray.controls.some(
      (control) => !control.get('name')?.value?.trim(),
    );
    if (invalidCast) {
      this.error.set('All cast members must have a name');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const formData = this.form.value;

    // Convert cast FormArray to CastMember array
    const castMembers = formData.cast.map((castMember: any) => ({
      name: castMember.name,
      image_url: castMember.image_url || null,
    }));

    // Convert comma-separated strings to arrays
    const writers = formData.writers
      ? formData.writers.split(',').map((w: string) => w.trim())
      : [];
    const producers = formData.producers
      ? formData.producers.split(',').map((p: string) => p.trim())
      : [];
    const awards = formData.awards ? formData.awards.split(',').map((a: string) => a.trim()) : [];

    // Parse details as JSON if provided, otherwise empty object
    let details = {};
    if (formData.details) {
      try {
        details = JSON.parse(formData.details);
      } catch (e) {
        // If JSON parsing fails, treat as string
        details = { note: formData.details };
      }
    }

    const movieData: any = {
      title: formData.title,
      description: formData.description,
      duration_minutes: parseInt(formData.duration_minutes, 10),
      genre: Array.isArray(formData.genre) ? formData.genre : [formData.genre],
      rating: formData.rating,
      state: formData.state,
      cast: castMembers,
      director: formData.director,
      writers: writers,
      producers: producers,
      release_date: formData.release_date,
      country: formData.country,
      language: formData.language,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      revenue: formData.revenue ? parseFloat(formData.revenue) : null,
      production_company: formData.production_company || null,
      distributor: formData.distributor || null,
      image_url: formData.image_url || null,
      trailer_url: formData.trailer_url || null,
      awards: awards,
      details: details,
    };

    const request$ = this.isEditMode()
      ? this.moviesApi.updateMovie(this.movieId()!, movieData)
      : this.moviesApi.createMovie(movieData);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.router.navigate(['/admin/movies']);
      },
      error: (err) => {
        this.error.set('Failed to save movie');
        this.loading.set(false);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/admin/movies']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) {
      if (fieldName === 'genre') {
        return 'At least one genre is required';
      }
      return `${fieldName} is required`;
    }
    if (control.errors['minlength'])
      return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['min']) return `${fieldName} must be at least ${control.errors['min'].min}`;
    if (control.errors['max']) return `${fieldName} must not exceed ${control.errors['max'].max}`;

    return 'Invalid input';
  }
}
