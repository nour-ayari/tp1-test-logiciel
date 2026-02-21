import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MovieModel } from '../models/movie.model';
import { Cinema } from '../models/cinema.model';
import { environment } from '../../environments/environment';

export interface Favorite {
  id: number;
  user_id: number;
  cinema_id: number | null;
  movie_id: number | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  // Cinema favorites
  addCinemaToFavorites(cinemaId: number): Observable<Favorite> {
    return this.http.post<Favorite>(`${this.apiUrl}/cinemas/${cinemaId}/favorite`, {});
  }

  removeCinemaFromFavorites(cinemaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cinemas/${cinemaId}/favorite`);
  }

  getFavoriteCinemas(): Observable<Cinema[]> {
    return this.http.get<Cinema[]>(`${this.apiUrl}/cinemas/favorites`);
  }

  // Movie favorites
  addMovieToFavorites(movieId: number): Observable<Favorite> {
    return this.http.post<Favorite>(`${this.apiUrl}/movies/${movieId}/favorite`, {});
  }

  removeMovieFromFavorites(movieId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/movies/${movieId}/favorite`);
  }

  getFavoriteMovies(): Observable<MovieModel[]> {
    return this.http.get<MovieModel[]>(`${this.apiUrl}/movies/favorites`);
  }

  // Coming soon movies
  getComingSoonMovies(skip: number = 0, limit: number = 10): Observable<MovieModel[]> {
    return this.http.get<MovieModel[]>(
      `${this.apiUrl}/movies?state=COMING_SOON&skip=${skip}&limit=${limit}`,
    );
  }

  // Trending movies
  getTrendingMovies(skip: number = 0, limit: number = 10): Observable<MovieModel[]> {
    return this.http.get<MovieModel[]>(
      `${this.apiUrl}/movies?state=SHOWING&sort_by=trending&skip=${skip}&limit=${limit}`,
    );
  }

  // Now showing movies
  getNowShowingMovies(skip: number = 0, limit: number = 10): Observable<MovieModel[]> {
    return this.http.get<MovieModel[]>(
      `${this.apiUrl}/movies?state=SHOWING&skip=${skip}&limit=${limit}`,
    );
  }
}
