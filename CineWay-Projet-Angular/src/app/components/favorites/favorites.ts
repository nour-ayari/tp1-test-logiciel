import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { MovieModel } from '../../models/movie.model';
import { Cinema } from '../../models/cinema.model';

@Component({
  selector: 'app-favorites',

  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class FavoritesComponent implements OnInit {
  favoriteMovies = signal<MovieModel[]>([]);
  favoriteCinemas = signal<Cinema[]>([]);
  activeTab = signal<'movies' | 'cinemas'>('movies');
  isLoading = signal(true);
  error = signal<string | null>(null);

  private favoritesService = inject(FavoritesService);

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    this.isLoading.set(true);
    this.error.set(null);

    // Load movies
    this.favoritesService.getFavoriteMovies().subscribe({
      next: (movies: MovieModel[]) => {
        this.favoriteMovies.set(movies);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading favorite movies:', err);
        this.error.set('Failed to load favorite movies');
        this.isLoading.set(false);
      },
    });

    // Load cinemas
    this.favoritesService.getFavoriteCinemas().subscribe({
      next: (cinemas: Cinema[]) => {
        this.favoriteCinemas.set(cinemas);
      },
      error: (err: any) => {
        console.error('Error loading favorite cinemas:', err);
      },
    });
  }

  setActiveTab(tab: 'movies' | 'cinemas') {
    this.activeTab.set(tab);
  }

  removeMovieFromFavorites(movieId: number) {
    this.favoritesService.removeMovieFromFavorites(movieId).subscribe({
      next: () => {
        const updatedMovies = this.favoriteMovies().filter((m) => m.id !== movieId);
        this.favoriteMovies.set(updatedMovies);
      },
      error: (err: any) => {
        console.error('Error removing movie from favorites:', err);
        alert('Failed to remove movie from favorites');
      },
    });
  }

  removeCinemaFromFavorites(cinemaId: number) {
    this.favoritesService.removeCinemaFromFavorites(cinemaId).subscribe({
      next: () => {
        const updatedCinemas = this.favoriteCinemas().filter((c) => c.id !== cinemaId);
        this.favoriteCinemas.set(updatedCinemas);
      },
      error: (err: any) => {
        console.error('Error removing cinema from favorites:', err);
        alert('Failed to remove cinema from favorites');
      },
    });
  }
}
