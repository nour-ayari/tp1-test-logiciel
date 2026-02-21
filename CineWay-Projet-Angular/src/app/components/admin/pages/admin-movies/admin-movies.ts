import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchInputComponent } from '../../components/search-input/search-input';
import { PaginationComponent } from '../../components/pagination/pagination';
import { PrimaryButtonComponent } from '../../components/primary-button/primary-button';
import { MoviesApi } from '../../../../services/movies-api';
import { MovieModel } from '../../../../models/movie.model';

type MovieState = 'SHOWING' | 'COMING_SOON' | 'ENDED';

@Component({
  selector: 'app-admin-movies',
  imports: [CommonModule, SearchInputComponent, PaginationComponent, PrimaryButtonComponent],
  templateUrl: './admin-movies.html',
  styleUrls: ['./admin-movies.css'],
})
export class AdminMoviesComponent implements OnInit {
  private router = inject(Router);
  private moviesApi = inject(MoviesApi);
  private destroyRef = inject(DestroyRef);
  private readonly pageSize = 10;

  // State
  readonly movies = signal<MovieModel[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly stateFilter = signal<MovieState | 'all'>('all');
  readonly page = signal(1);
  readonly updatingMovieId = signal<number | null>(null);

  // Computed
  readonly stateOptions: (MovieState | 'all')[] = ['all', 'SHOWING', 'COMING_SOON', 'ENDED'];

  readonly stateDropdownOptions = computed(() =>
    this.stateOptions.map((s) => ({
      value: s,
      label: s === 'all' ? 'All States' : this.formatStateLabel(s as MovieState),
    })),
  );

  readonly filteredMovies = computed(() => {
    const term = this.searchTerm().toLowerCase();

    return this.movies().filter((movie) => {
      const matchesTerm =
        !term ||
        movie.title.toLowerCase().includes(term) ||
        movie.description.toLowerCase().includes(term);
      return matchesTerm;
    });
  });

  readonly totalPages = computed(() => {
    const total = this.filteredMovies().length;
    return total === 0 ? 1 : Math.ceil(total / this.pageSize);
  });

  readonly paginatedMovies = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredMovies().slice(start, start + this.pageSize);
  });

  readonly startIndex = computed(() => {
    const hasItems = this.filteredMovies().length > 0;
    return hasItems ? (this.page() - 1) * this.pageSize + 1 : 0;
  });

  readonly endIndex = computed(() => {
    const total = this.filteredMovies().length;
    return total === 0 ? 0 : Math.min(this.page() * this.pageSize, total);
  });

  ngOnInit() {
    this.loadMovies();
  }

  loadMovies() {
    this.loading.set(true);
    this.error.set(null);

    const state = this.stateFilter();
    const stateParam = state === 'all' ? undefined : state;

    this.moviesApi
      .getMovies(stateParam)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.movies.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load movies. Please try again.');
          this.loading.set(false);
        },
      });
  }

  onAddNew() {
    this.router.navigate(['/admin/movies/add']);
  }

  onAddScreening(movie: MovieModel) {
    this.router.navigate(['/admin/showtimes/add'], { queryParams: { movie_id: movie.id } });
  }

  onEdit(movie: MovieModel) {
    this.router.navigate(['/admin/movies/edit', movie.id]);
  }

  onDelete(movie: MovieModel) {
    if (confirm(`Are you sure you want to delete "${movie.title}"?`)) {
      this.moviesApi
        .deleteMovie(movie.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadMovies();
          },
          error: (err) => {
            this.error.set('Failed to delete movie. Please try again.');
          },
        });
    }
  }

  updateSearch(value: string) {
    this.searchTerm.set(value);
    this.page.set(1);
  }

  updateStateFilter(state: MovieState | 'all') {
    this.stateFilter.set(state);
    this.page.set(1);
    this.loadMovies();
  }

  changeMovieState(movie: MovieModel, newState: MovieState) {
    if (movie.state === newState) return;

    this.updatingMovieId.set(movie.id);

    this.moviesApi
      .updateMovie(movie.id, { state: newState } as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedMovie) => {
          // Update the movie in the list
          const currentMovies = this.movies();
          const index = currentMovies.findIndex((m) => m.id === movie.id);
          if (index !== -1) {
            currentMovies[index] = { ...currentMovies[index], state: newState };
            this.movies.set([...currentMovies]);
          }
          this.updatingMovieId.set(null);
        },
        error: (err) => {
          this.error.set('Failed to update movie state. Please try again.');
          this.updatingMovieId.set(null);
          setTimeout(() => this.error.set(null), 3000);
        },
      });
  }

  previousPage() {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
    }
  }

  formatStateLabel(state: MovieState): string {
    const labels: Record<MovieState, string> = {
      SHOWING: 'Showing',
      COMING_SOON: 'Coming Soon',
      ENDED: 'Ended',
    };
    return labels[state] || state;
  }

  getStateBadgeClass(state: MovieState): string {
    const classes: Record<MovieState, string> = {
      SHOWING: 'state-showing',
      COMING_SOON: 'state-coming-soon',
      ENDED: 'state-ended',
    };
    return classes[state] || '';
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes || minutes <= 0) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}
