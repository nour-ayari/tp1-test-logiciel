import { Component, computed, input, OnInit, signal, inject, effect } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { APP_API } from '../../../config/app-api.config';
import { ShowtimeResponse, ShowtimeItem } from '../../../models/showtime.model';
import { TimeToHoursPipe } from '../../../pipes/time-tohours-pipe';
import { MovieModel } from '../../../models/movie.model';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-showtimes',
  imports: [DatePipe, TimeToHoursPipe],
  templateUrl: './showtimes.html',
  styleUrl: './showtimes.css',
})
export class Showtimes implements OnInit {
  cinemaId = input.required<number | undefined>();
  private router = inject(Router);
  private http = inject(HttpClient);

  readonly moviesRes = httpResource<{ movies: MovieModel[] }>(() => {
    const cid = this.cinemaId();
    return {
      url: APP_API.cinema.movies(cid!),
      method: 'GET',
    };
  });

  showtimesData = signal<ShowtimeResponse[]>([]);

  constructor() {
    effect(() => {
      const moviesResponse = this.moviesRes.value();
      const movies = moviesResponse?.movies;
      if (movies && movies.length > 0) {
        const cid = this.cinemaId();
        if (!cid) return;
        const requests = movies.map((movie) =>
          this.http.get<ShowtimeItem[]>(APP_API.cinema.movieShowtimes(cid, movie.id)),
        );
        forkJoin(requests).subscribe({
          next: (results) => {
            const showtimeResponses: ShowtimeResponse[] = results.map((showtimes, index) => ({
              movie: movies[index],
              showtimes,
            }));
            this.showtimesData.set(showtimeResponses);
          },
          error: (err) => {
            console.error('Error loading showtimes:', err);
          },
        });
      }
    });
  }

  showTimes = computed(() => {
    const value = this.showtimesData();
    return value ?? [];
  });

  groupedMovies = computed(() => {
    const items = this.showTimes();
    const grouped: {
      [movieId: number]: { movie: MovieModel; dates: { [date: string]: ShowtimeItem[] } };
    } = {};
    for (const item of items) {
      const movieId = item.movie.id;
      if (!grouped[movieId]) {
        grouped[movieId] = { movie: item.movie, dates: {} };
      }
      for (const st of item.showtimes) {
        const date = new Date(st.screening_time).toISOString().split('T')[0];
        if (!grouped[movieId].dates[date]) {
          grouped[movieId].dates[date] = [];
        }
        grouped[movieId].dates[date].push(st);
      }
    }
    return Object.values(grouped);
  });

  error = computed(() => {
    const err = this.moviesRes.error();
    return err;
  });
  isLoading = computed(() => {
    const loading = this.moviesRes.isLoading();
    return loading;
  });
  days = computed(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        label:
          i === 0
            ? 'Today'
            : i === 1
              ? 'Tomorrow'
              : date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }),
        date: date.toISOString().split('T')[0],
        fullDate: date,
      });
    }
    return days;
  });

  selectedDay = signal<string>('');

  ngOnInit() {
    this.selectedDay.set(this.days()[0].date);
  }
  chooseShowtime(showtimeId: number, movie: MovieModel) {
    this.router.navigate(['/screenings', showtimeId]);
  }
}
