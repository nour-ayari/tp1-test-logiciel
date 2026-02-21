import { Component, computed, effect, input, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { APP_API } from '../../../config/app-api.config';
import { MovieModel } from '../../../models/movie.model';
import { Movie } from '../../movies/movie/movie';

interface CinemaMoviesResponse {
  movies: MovieModel[];
  total: number;
}

@Component({
  selector: 'app-movies-list',
  imports: [Movie],
  templateUrl: './movies-list.html',
  styleUrl: './movies-list.css',
})
export class MoviesList {
  cinemaId = input.required<number>();
  readonly limit = 6;
  private skip = signal(0);
  loadedMovies = signal<MovieModel[]>([]);

  readonly cinemaMovies = httpResource<CinemaMoviesResponse>(() => ({
    url: `${APP_API.cinema.list}${this.cinemaId()}/movies`,
    method: 'GET',
    params: {
      skip: this.skip(),
      limit: this.limit,
    },
  }));

  Error = computed(() => this.cinemaMovies.error());
  isLoading = computed(() => this.cinemaMovies.isLoading());
  hasMore = computed(() => {
    const data = this.cinemaMovies.value();
    if (!data) return false;
    return this.loadedMovies().length < data.total;
  });

  loadMore() {
    if (this.hasMore() && !this.isLoading()) {
      this.skip.update((s) => s + this.limit);
    }
  }
  constructor() {
    this.cinemaId;
    this.skip.set(0);
    this.loadedMovies.set([]);
    effect(() => {
      const data = this.cinemaMovies.value();
      if (!data) return;
      this.loadedMovies.update((existing) => [...existing, ...data.movies]);
    });
  }
}
