import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { APP_API } from '../../../config/app-api.config';
import { ShowtimeDatePipe } from '../../../pipes/showtime-date.pipe';

interface Cinema {
  id: number;
  name: string;
  address: string;
  city: string;
  amenities?: string[];
  created_at: string;
}

interface Room {
  id: number;
  name: string;
  cinema_id: number;
  created_at: string;
  cinema: Cinema;
}

interface Movie {
  id: number;
  title: string;
  image_url?: string;
  duration_minutes?: number;
  genre?: string[];
  rating?: string;
}

interface MovieShowtime {
  id: number;
  screening_time: string;
  price: number;
  movie: Movie;
  room: Room;
}

@Component({
  selector: 'app-movie-showtimes',
  imports: [CommonModule, ShowtimeDatePipe],
  templateUrl: './movie-showtimes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieShowtimesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  movieId = signal<number | null>(null);
  showtimes = signal<MovieShowtime[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  selectedDate = signal<string>('');

  movie = computed(() => {
    const showtimes = this.showtimes();
    return showtimes.length > 0 ? showtimes[0].movie : null;
  });

  // Group showtimes by cinema
  groupedShowtimes = computed(() => {
    const showtimes = this.showtimes();
    const grouped = new Map<number, { cinema: Cinema; showtimes: MovieShowtime[] }>();

    showtimes.forEach((showtime) => {
      const cinemaId = showtime.room.cinema.id;
      if (!grouped.has(cinemaId)) {
        grouped.set(cinemaId, {
          cinema: showtime.room.cinema,
          showtimes: [],
        });
      }
      grouped.get(cinemaId)!.showtimes.push(showtime);
    });

    return Array.from(grouped.values());
  });

  // Get next 7 days starting from today
  availableDates = computed(() => {
    return this.getNext7Days();
  });

  // Get dates that actually have showtimes
  datesWithShowtimes = computed(() => {
    const showtimes = this.showtimes();
    const dates = new Set<string>();

    showtimes.forEach((showtime) => {
      const date = new Date(showtime.screening_time).toISOString().split('T')[0];
      dates.add(date);
    });

    return dates;
  });

  private getNext7Days(): string[] {
    const today = new Date();
    const dates: string[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/explore']);
      return;
    }

    this.movieId.set(Number(id));
    this.loadShowtimes();
  }

  private loadShowtimes(): void {
    const id = this.movieId();
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('skip', '0').set('limit', '1000');

    this.http
      .get<MovieShowtime[]>(APP_API.movies.showtimes(id), { params })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (showtimes) => {
          this.showtimes.set(showtimes);
          this.loading.set(false);
          // Set default selected date to today if it has showtimes, otherwise first date with showtimes
          if (!this.selectedDate()) {
            const datesWithShowtimes = this.datesWithShowtimes();
            const today = new Date().toISOString().split('T')[0];

            if (datesWithShowtimes.has(today)) {
              this.selectedDate.set(today);
            } else {
              // Find first date with showtimes
              const firstDateWithShowtimes = Array.from(datesWithShowtimes).sort()[0];
              if (firstDateWithShowtimes) {
                this.selectedDate.set(firstDateWithShowtimes);
              }
            }
          }
        },
        error: (err) => {
          this.error.set('Failed to load showtimes');
          this.loading.set(false);
        },
      });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    };
    return date.toLocaleDateString('en-US', options);
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }

  selectShowtime(showtimeId: number): void {
    this.router.navigate(['/screenings', showtimeId]);
  }

  goBack(): void {
    const movieId = this.movieId();
    if (movieId) {
      this.router.navigate(['/movies', movieId]);
    } else {
      window.history.back();
    }
  }

  isToday(dateString: string): boolean {
    const date = new Date(dateString).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  }

  isTomorrow(dateString: string): boolean {
    const date = new Date(dateString).toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return date === tomorrowStr;
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  getShowtimesForSelectedDate(): MovieShowtime[] {
    const selected = this.selectedDate();
    if (!selected) return this.showtimes();

    return this.showtimes().filter((showtime) => {
      const date = new Date(showtime.screening_time).toISOString().split('T')[0];
      return date === selected;
    });
  }

  getGroupedShowtimesForSelectedDate() {
    const showtimes = this.getShowtimesForSelectedDate();
    const grouped = new Map<number, { cinema: Cinema; showtimes: MovieShowtime[] }>();

    showtimes.forEach((showtime) => {
      const cinemaId = showtime.room.cinema.id;
      if (!grouped.has(cinemaId)) {
        grouped.set(cinemaId, {
          cinema: showtime.room.cinema,
          showtimes: [],
        });
      }
      grouped.get(cinemaId)!.showtimes.push(showtime);
    });

    return Array.from(grouped.values());
  }
}
