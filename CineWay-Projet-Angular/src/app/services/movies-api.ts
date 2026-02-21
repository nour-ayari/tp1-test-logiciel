import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map } from 'rxjs';
import { MovieModel, CastMember } from '../models/movie.model';
import { APP_API } from '../config/app-api.config';
@Injectable({
  providedIn: 'root',
})
export class MoviesApi {
  private http = inject(HttpClient);

  readonly moviesCache = signal<MovieModel[]>([]);
  readonly trendingMoviesCache = signal<MovieModel[]>([]);
  readonly isLoadingMovies = signal<boolean>(false);
  readonly moviesError = signal<string | null>(null);

  getMovies(state?: string, sortBy?: string) {
    let url = `${APP_API.movies.movies}/`;
    const params: string[] = [];

    if (state) params.push(`state=${state}`);
    if (sortBy) params.push(`sort_by=${sortBy}`);

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http
      .get<MovieModel[]>(url)
      .pipe(map((movies) => movies.map((movie) => this.transformMovieResponse(movie))));
  }

  getTrendingMovies() {
    return this.http
      .get<MovieModel[]>(APP_API.movies.trending)
      .pipe(map((movies) => movies.map((movie) => this.transformMovieResponse(movie))));
  }

  getShowingMovies() {
    return this.getMovies('SHOWING');
  }

  getComingSoonMovies() {
    return this.getMovies('COMING_SOON');
  }

  getEndedMovies() {
    return this.getMovies('ENDED');
  }

  getMovieById(id: number) {
    return this.http
      .get<MovieModel>(`${APP_API.movies.movies}/${id}`)
      .pipe(map((movie) => this.transformMovieResponse(movie)));
  }

  createMovie(movie: MovieModel) {
    const payload = this.prepareMoviePayload(movie);
    return this.http.post<MovieModel>(`${APP_API.movies.movies}/`, payload);
  }

  updateMovie(id: number, movie: MovieModel) {
    const payload = this.prepareMoviePayload(movie);
    return this.http.patch<MovieModel>(`${APP_API.movies.movies}/${id}`, payload);
  }

  deleteMovie(id: number) {
    return this.http.delete(`${APP_API.movies.movies}/${id}`);
  }

  private transformMovieResponse(movie: any): MovieModel {
    return {
      ...movie,
      status: movie.state || movie.status, // Map 'state' from backend to 'status' for frontend
      cast: Array.isArray(movie.cast)
        ? movie.cast.map(
            (actor: any): CastMember =>
              typeof actor === 'string'
                ? {
                    name: actor,
                    image_url: null,
                  }
                : {
                    name: actor.name || actor.actor_name || '',
                    image_url: actor.image_url || actor.profile_image_url || null,
                  },
          )
        : [],
    };
  }

  private prepareMoviePayload(movie: any) {
    // Helper function to convert comma-separated string to array
    const stringToArray = (value: string | string[] | null | undefined): string[] | null => {
      if (!value) return null;
      if (Array.isArray(value)) return value;
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    };

    const payload: any = {};

    // Only include fields that are present in the movie object
    if (movie.title !== undefined) payload.title = movie.title;
    if (movie.description !== undefined) payload.description = movie.description || null;
    if (movie.duration_minutes !== undefined)
      payload.duration_minutes = parseInt(movie.duration_minutes, 10);
    if (movie.genre !== undefined)
      payload.genre = Array.isArray(movie.genre) ? movie.genre : [movie.genre];
    if (movie.rating !== undefined) payload.rating = movie.rating ? String(movie.rating) : null;
    if (movie.state !== undefined) payload.state = movie.state;
    if (movie.cast !== undefined) {
      payload.cast = Array.isArray(movie.cast)
        ? movie.cast.map((actor: any) =>
            typeof actor === 'string'
              ? {
                  actor_name: actor,
                  character_name: '',
                  role: 'Actor',
                  profile_image_url: null,
                  is_lead: false,
                  order: 0,
                }
              : actor,
          )
        : [];
    }
    if (movie.director !== undefined) payload.director = movie.director || null;
    if (movie.writers !== undefined) payload.writers = stringToArray(movie.writers);
    if (movie.producers !== undefined) payload.producers = stringToArray(movie.producers);
    if (movie.release_date !== undefined) payload.release_date = movie.release_date || null;
    if (movie.country !== undefined) payload.country = movie.country || null;
    if (movie.language !== undefined) payload.language = movie.language || null;
    if (movie.budget !== undefined) payload.budget = movie.budget ? parseFloat(movie.budget) : null;
    if (movie.revenue !== undefined)
      payload.revenue = movie.revenue ? parseFloat(movie.revenue) : null;
    if (movie.production_company !== undefined)
      payload.production_company = movie.production_company || null;
    if (movie.distributor !== undefined) payload.distributor = movie.distributor || null;
    if (movie.image_url !== undefined || movie.poster_url !== undefined) {
      payload.image_url = movie.poster_url || movie.image_url || null;
    }
    if (movie.trailer_url !== undefined) payload.trailer_url = movie.trailer_url || null;
    if (movie.awards !== undefined) payload.awards = stringToArray(movie.awards);
    if (movie.details !== undefined) payload.details = movie.details || null;

    return payload;
  }
  /**
   * Fetches movies and updates the signal cache
   * @param state Optional movie state filter
   * @param sortBy Optional sort parameter
   */
  loadMovies(state?: string, sortBy?: string): void {
    this.isLoadingMovies.set(true);
    this.moviesError.set(null);

    this.getMovies(state, sortBy).subscribe({
      next: (movies) => {
        this.moviesCache.set(movies);
        this.isLoadingMovies.set(false);
      },
      error: (err) => {
        this.moviesError.set('Failed to load movies');
        this.isLoadingMovies.set(false);
      },
    });
  }

  /**
   * Fetches trending movies and updates the signal cache
   */
  loadTrendingMovies(): void {
    this.getTrendingMovies().subscribe({
      next: (movies) => this.trendingMoviesCache.set(movies),
      error: (err) => console.error('Failed to load trending movies', err),
    });
  }

  /**
   * Clears all cached movie data
   */
  clearCache(): void {
    this.moviesCache.set([]);
    this.trendingMoviesCache.set([]);
    this.moviesError.set(null);
  }
}
