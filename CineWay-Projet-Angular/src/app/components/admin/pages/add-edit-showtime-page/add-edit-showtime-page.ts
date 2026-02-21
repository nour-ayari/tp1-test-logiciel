import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScreeningService, Screening } from '../../../../services/screening.service';
import { MoviesApi } from '../../../../services/movies-api';
import { CinemaService } from '../../../../services/cinema.service';
import { MovieModel } from '../../../../models/movie.model';
import { Cinema } from '../../../../models/cinema.model';
import { APP_API } from '../../../../config/app-api.config';

interface Room {
  id: number;
  name: string;
  cinema_id: number;
}

@Component({
  selector: 'app-add-edit-showtime-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-edit-showtime-page.html',
  styleUrls: ['./add-edit-showtime-page.css'],
})
export class AddEditShowtimePageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private screeningService = inject(ScreeningService);
  private moviesApi = inject(MoviesApi);
  private cinemasApi = inject(CinemaService);
  private destroyRef = inject(DestroyRef);

  isEditMode = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  showtimeId = signal<number | null>(null);

  form!: FormGroup;

  cinemas = signal<Cinema[]>([]);
  movies = signal<MovieModel[]>([]);
  rooms = signal<Room[]>([]);

  ngOnInit() {
    this.initializeForm();
    this.loadData();
    this.checkEditMode();
  }

  private initializeForm() {
    this.form = this.fb.group({
      movie_id: ['', Validators.required],
      cinema_id: ['', Validators.required],
      room_id: ['', Validators.required],
      screening_date: ['', Validators.required],
      screening_time: ['', Validators.required],
      ticket_price: ['', [Validators.required, Validators.min(0)]],
    });
  }

  private checkEditMode() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.showtimeId.set(parseInt(id, 10));
      this.loadShowtime(parseInt(id, 10));
    }
  }

  private loadData() {
    this.loading.set(true);
    this.moviesApi
      .getMovies()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (movies) => {
          this.movies.set(movies);
          this.loading.set(false);
          const movieId = this.route.snapshot.queryParams['movie_id'];
          if (movieId) {
            this.form.patchValue({ movie_id: parseInt(movieId, 10) });
          }
        },
        error: (err) => {
          this.error.set('Failed to load movies');
          this.loading.set(false);
        },
      });

    this.cinemasApi
      .getCinemas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.cinemas.set(response.cinemas || []);
        },
        error: (err) => {
          this.error.set('Failed to load cinemas');
        },
      });
  }

  private checkMovieQueryParam() {
    const movieId = this.route.snapshot.queryParams['movie_id'];
    if (movieId) {
      this.form.patchValue({ movie_id: parseInt(movieId, 10) });
    }
  }

  private loadShowtime(id: number) {
    this.loading.set(true);
    this.screeningService
      .getScreening(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (showtime: Screening) => {
          const date = new Date(showtime.screening_time);
          const dateStr = date.toISOString().split('T')[0];
          const timeStr = date.toTimeString().slice(0, 5);

          this.form.patchValue({
            movie_id: showtime.movie_id,
            cinema_id: showtime.room?.cinema_id || '',
            room_id: showtime.room_id,
            screening_date: dateStr,
            screening_time: timeStr,
            ticket_price: showtime.price,
          });

          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load showtime');
          this.loading.set(false);
        },
      });
  }

  onCinemaChange() {
    const cinemaId = this.form.get('cinema_id')?.value;
    if (!cinemaId) {
      this.rooms.set([]);
      return;
    }

    this.http
      .get<Room[]>(`${APP_API.cinema.list}${cinemaId}/rooms/`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rooms) => {
          this.rooms.set(rooms || []);
          this.form.get('room_id')?.reset();
        },
        error: (err) => {
          this.error.set('Failed to load cinema rooms');
          this.rooms.set([]);
        },
      });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.loading.set(true);
    const formValue = this.form.value;

    const dateTime = `${formValue.screening_date}T${formValue.screening_time}:00Z`;
    const showtimeData = {
      movie_id: formValue.movie_id,
      room_id: formValue.room_id,
      screening_time: dateTime,
      price: formValue.ticket_price,
    };

    const request = this.isEditMode()
      ? this.screeningService.updateScreening(this.showtimeId()!, showtimeData)
      : this.screeningService.createScreening(showtimeData);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/admin/showtimes']);
      },
      error: (err) => {
        this.error.set('Failed to save showtime');
        this.loading.set(false);
      },
    });
  }

  onCancel() {
    this.router.navigate(['/admin/showtimes']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) return `${fieldName} is required`;
    if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;

    return 'Invalid field';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
