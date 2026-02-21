import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MoviesApi } from '../../services/movies-api';
import { FavoritesService } from '../../services/favorites.service';
import { MovieModel } from '../../models/movie.model';

@Component({
  selector: 'app-showing-now',

  imports: [CommonModule, RouterModule],
  templateUrl: './showing-now.html',
  styleUrls: ['./showing-now.css'],
})
export class ShowingNowComponent implements OnInit {
  showingNowMovies = signal<MovieModel[]>([]);
  allShowingMovies = signal<MovieModel[]>([]);
  isLoading = signal(false);
  isLoadingMore = signal(false);
  hasMoreMovies = signal(true);
  currentIndex = signal(0);
  readonly limit = 15;
  favoriteMovieIds = new Set<number>();

  private moviesApi = inject(MoviesApi);
  private favoritesService = inject(FavoritesService);

  ngOnInit() {
    this.loadShowingNowMovies();
    this.loadFavorites();
  }

  loadShowingNowMovies() {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.moviesApi.getShowingMovies().subscribe({
      next: (movies) => {
        const showingMovies = movies.map((movie) => ({
          ...movie,
          status: movie.state || 'SHOWING',
        }));

        this.allShowingMovies.set(showingMovies);

        // Load first batch
        const firstBatch = showingMovies.slice(0, this.limit);
        this.showingNowMovies.set(firstBatch);
        this.currentIndex.set(this.limit);

        if (firstBatch.length >= showingMovies.length) {
          this.hasMoreMovies.set(false);
        }

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading now showing movies:', error);
        this.isLoading.set(false);
      },
    });
  }

  loadMoreMovies() {
    if (this.isLoadingMore() || !this.hasMoreMovies()) return;

    this.isLoadingMore.set(true);

    const allMovies = this.allShowingMovies();
    const currentIdx = this.currentIndex();
    const nextBatch = allMovies.slice(currentIdx, currentIdx + this.limit);

    this.showingNowMovies.set([...this.showingNowMovies(), ...nextBatch]);
    this.currentIndex.set(currentIdx + this.limit);

    if (this.currentIndex() >= allMovies.length) {
      this.hasMoreMovies.set(false);
    }

    this.isLoadingMore.set(false);
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

  formatReleaseDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SHOWING':
        return 'status-showing';
      case 'COMING_SOON':
        return 'status-coming-soon';
      case 'ENDED':
        return 'status-ended';
      default:
        return 'status-showing';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'SHOWING':
        return 'bi bi-play-circle';
      case 'COMING_SOON':
        return 'bi bi-calendar-event';
      case 'ENDED':
        return 'bi bi-clock-history';
      default:
        return 'bi bi-play-circle';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'SHOWING':
        return 'Now Showing';
      case 'COMING_SOON':
        return 'Coming Soon';
      case 'ENDED':
        return 'Ended';
      default:
        return 'Now Showing';
    }
  }
}
