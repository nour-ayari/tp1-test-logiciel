import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { MovieModel } from '../../models/movie.model';

@Component({
  selector: 'app-coming-soon',

  imports: [CommonModule, RouterModule],
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.css',
})
export class ComingSoonComponent implements OnInit {
  comingSoonMovies = signal<MovieModel[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  moviesPerPage = 15;
  hasMoreMovies = signal(true);
  favoriteMovieIds = new Set<number>();

  private favoritesService = inject(FavoritesService);

  ngOnInit() {
    this.loadComingSoonMovies();
    this.loadFavorites();
  }

  loadComingSoonMovies() {
    this.isLoading.set(true);
    this.error.set(null);

    const skip = (this.currentPage() - 1) * this.moviesPerPage;

    this.favoritesService.getComingSoonMovies(skip, this.moviesPerPage).subscribe({
      next: (movies: MovieModel[]) => {
        // Movies are already filtered by backend with state=COMING_SOON
        const moviesWithStatus = movies.map((movie) => ({
          ...movie,
          status: movie.state || 'COMING_SOON',
        }));

        if (movies.length < this.moviesPerPage) {
          this.hasMoreMovies.set(false);
        }

        if (this.currentPage() === 1) {
          this.comingSoonMovies.set(moviesWithStatus);
        } else {
          this.comingSoonMovies.set([...this.comingSoonMovies(), ...moviesWithStatus]);
        }

        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading coming soon movies:', err);
        this.error.set('Failed to load coming soon movies');
        this.isLoading.set(false);
      },
    });
  }

  loadMoreMovies() {
    if (!this.hasMoreMovies() || this.isLoading()) return;

    this.currentPage.set(this.currentPage() + 1);
    this.loadComingSoonMovies();
  }

  refreshMovies() {
    this.currentPage.set(1);
    this.hasMoreMovies.set(true);
    this.loadComingSoonMovies();
  }

  private loadFavorites(): void {
    this.favoritesService.getFavoriteMovies().subscribe({
      next: (movies) => {
        this.favoriteMovieIds = new Set(movies.map((m) => m.id));
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
      },
    });
  }

  isFavorite(movieId: number): boolean {
    return this.favoriteMovieIds.has(movieId);
  }

  toggleFavorite(movie: MovieModel, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const isFavorited = this.favoriteMovieIds.has(movie.id);

    if (isFavorited) {
      this.favoritesService.removeMovieFromFavorites(movie.id).subscribe({
        next: () => {
          this.favoriteMovieIds.delete(movie.id);
        },
        error: (error) => {
          console.error('Error removing from favorites:', error);
        },
      });
    } else {
      this.favoritesService.addMovieToFavorites(movie.id).subscribe({
        next: () => {
          this.favoriteMovieIds.add(movie.id);
        },
        error: (error) => {
          console.error('Error adding to favorites:', error);
        },
      });
    }
  }
}
