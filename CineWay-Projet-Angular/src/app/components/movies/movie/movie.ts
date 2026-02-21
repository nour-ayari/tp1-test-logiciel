import { Component, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MovieModel } from '../../../models/movie.model';
import { FavoritesService } from '../../../services/favorites.service';

@Component({
  selector: 'app-movie',
  imports: [CommonModule, RouterLink],
  templateUrl: './movie.html',
  styleUrl: './movie.css',
})
export class Movie {
  movie = input.required<MovieModel>();
  isFavorite = signal(false);

  private favoritesService = inject(FavoritesService);

  constructor() {}

  toggleFavorite(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    if (this.isFavorite()) {
      this.favoritesService.removeMovieFromFavorites(this.movie().id).subscribe({
        next: () => {
          this.isFavorite.set(false);
        },
        error: (err: any) => {
          console.error('Error removing from favorites:', err);
        },
      });
    } else {
      this.favoritesService.addMovieToFavorites(this.movie().id).subscribe({
        next: () => {
          this.isFavorite.set(true);
        },
        error: (err: any) => {
          console.error('Error adding to favorites:', err);
        },
      });
    }
  }
}
