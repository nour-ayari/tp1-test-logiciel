import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { AuthService } from '../../auth/services/auth.service';
import { MoviesApi } from '../../services/movies-api';
import { FavoritesService } from '../../services/favorites.service';
import { MovieModel } from '../../models/movie.model';
import { ToastrService } from 'ngx-toastr';

interface SearchHistory {
  query: string;
  timestamp: Date;
  type: 'movie' | 'cinema';
}

@Component({
  selector: 'app-explore',
  templateUrl: './explore.html',
  styleUrls: ['./explore.css'],
  imports: [CommonModule, FormsModule, RouterLink],

})
export class Explore implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly moviesApi = inject(MoviesApi);
  private readonly favoritesService = inject(FavoritesService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject$ = new Subject<string>();

  searchQuery = '';
  activeFilter: 'all' | 'movies' | 'cinemas' = 'all';
  isSearching = false;
  showSearchResults = false;
  showSearchPanel = false;

  allMovies: MovieModel[] = [];
  nowShowingMovies: MovieModel[] = [];
  comingSoonMovies: MovieModel[] = [];
  searchResults: MovieModel[] = [];
  trendingMovies: MovieModel[] = [];
  featuredMovie: MovieModel | null = null;

  recentSearches: SearchHistory[] = [];
  favoriteMovieIds: Set<number> = new Set();

  isLoadingMovies$ = new BehaviorSubject<boolean>(false);

  private readonly MOVIES_PER_CATEGORY = 5;
  private readonly RECENT_SEARCHES_LIMIT = 3;
  private readonly TRENDING_MOVIES_LIMIT = 5;
  private readonly SEARCH_DEBOUNCE_TIME = 300;
  private readonly STORAGE_KEY = 'cineway_recent_searches';
  private readonly PLACEHOLDER_IMAGE = 'https://via.placeholder.com/1200x500';

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject$.complete();
  }

  private initializeComponent(): void {
    this.setupSearchDebounce();
    this.loadAllMovies();
    this.loadRecentSearches();
    this.loadFavorites();
  }

  private loadFavorites(): void {
    this.favoritesService
      .getFavoriteMovies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(this.SEARCH_DEBOUNCE_TIME),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((searchTerm) => {
        this.performSearch(searchTerm);
      });
  }

  private loadAllMovies(): void {
    this.isLoadingMovies$.next(true);

    this.moviesApi
      .getShowingMovies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (movies) => {
          this.nowShowingMovies = movies.slice(0, this.MOVIES_PER_CATEGORY);
        },
        error: (error) => {
          console.error('Error loading showing movies:', error);
        },
      });

    this.moviesApi
      .getComingSoonMovies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (movies) => {
          this.comingSoonMovies = movies.slice(0, this.MOVIES_PER_CATEGORY);
          this.isLoadingMovies$.next(false);
        },
        error: (error) => {
          this.isLoadingMovies$.next(false);
          console.error('Error loading coming soon movies:', error);
          this.toastr.error('Failed to load movies. Please try again later.', 'Error');
        },
      });

    this.loadTrendingMovies();
  }

  private loadTrendingMovies(): void {
    this.moviesApi
      .getTrendingMovies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (movies) => {
          this.trendingMovies = movies
            .map((movie) => ({ ...movie, status: movie.state || 'SHOWING' }))
            .slice(0, this.TRENDING_MOVIES_LIMIT);
          this.featuredMovie = this.trendingMovies.sort((a, b) => b.revenue - a.revenue)[0] || null;
        },
        error: (error) => {
          console.error('Failed to load trending movies:', error);
          // Fallback to sorting from allMovies if API fails
          this.trendingMovies = this.allMovies
            .sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
            .map((movie) => ({ ...movie, status: movie.state || 'SHOWING' }))
            .slice(0, this.TRENDING_MOVIES_LIMIT);
          this.featuredMovie = this.trendingMovies.sort((a, b) => b.revenue - a.revenue)[0] || null;
        },
      });
  }

  private loadRecentSearches(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.recentSearches = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
    } catch (error) {
      this.recentSearches = [];
    }
  }

  private saveSearchHistory(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.recentSearches));
    } catch (error) {
      // Error saving search history
    }
  }

  onSearchInput(): void {
    this.showSearchPanel = true;

    if (!this.searchQuery.trim()) {
      this.showSearchResults = false;
      this.searchResults = [];
      return;
    }

    this.showSearchResults = true;
    this.isSearching = true;
    this.searchSubject$.next(this.searchQuery);
  }

  onSearchFocus(): void {
    this.showSearchPanel = true;
  }

  onSearchBlur(): void {
    setTimeout(() => {
      if (!this.showSearchResults) {
        this.showSearchPanel = false;
      }
    }, 200);
  }

  onSearchSubmit(): void {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.showSearchResults = true;
    this.showSearchPanel = false;
    this.saveToRecentSearches(this.searchQuery, 'movie');
    this.performSearch(this.searchQuery);
  }

  private performSearch(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.isSearching = false;
      return;
    }

    const query = searchTerm.toLowerCase();

    this.searchResults = this.allMovies.filter((movie) => this.matchesSearchCriteria(movie, query));

    this.isSearching = false;
  }

  private matchesSearchCriteria(movie: MovieModel, query: string): boolean {
    return (
      movie.title.toLowerCase().includes(query) ||
      movie.genre.some((g) => g.toLowerCase().includes(query)) ||
      (movie.description?.toLowerCase().includes(query) ?? false)
    );
  }

  private saveToRecentSearches(query: string, type: 'movie' | 'cinema'): void {
    const existingIndex = this.recentSearches.findIndex(
      (s) => s.query.toLowerCase() === query.toLowerCase(),
    );

    if (existingIndex !== -1) {
      this.recentSearches.splice(existingIndex, 1);
    }

    this.recentSearches.unshift({
      query,
      type,
      timestamp: new Date(),
    });

    if (this.recentSearches.length > this.RECENT_SEARCHES_LIMIT) {
      this.recentSearches = this.recentSearches.slice(0, this.RECENT_SEARCHES_LIMIT);
    }

    this.saveSearchHistory();
  }

  selectRecentSearch(search: SearchHistory): void {
    if (search.query) {
      this.searchQuery = search.query;
      this.onSearchSubmit();
    }
  }

  removeRecentSearch(index: number): void {
    this.recentSearches.splice(index, 1);
    this.saveSearchHistory();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.showSearchResults = false;
    this.showSearchPanel = false;
    this.searchResults = [];
  }

  setFilter(filter: 'all' | 'movies' | 'cinemas'): void {
    this.activeFilter = filter;
    if (this.searchQuery.trim()) {
      this.performSearch(this.searchQuery);
    }
  }

  onGetTickets(): void {
    if (this.featuredMovie) {
      this.router.navigate(['/cinemas']);
      this.toastr.success(`Finding cinemas for ${this.featuredMovie.title}...`);
    }
  }

  onSeeAllNowShowing(): void {
    this.router.navigate(['/showing-now']);
  }

  onSeeAllComingSoon(): void {
    this.router.navigate(['/coming-soon']);
  }

  onSeeAllTrending(): void {
    this.router.navigate(['/trending']);
  }

  toggleFavorite(movie: MovieModel, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    const isFavorited = this.favoriteMovieIds.has(movie.id);

    if (isFavorited) {
      // Remove from favorites
      this.favoritesService.removeMovieFromFavorites(movie.id).subscribe({
        next: () => {
          this.favoriteMovieIds.delete(movie.id);
        },
        error: (error) => {
          console.error('Error removing from favorites:', error);
        },
      });
    } else {
      // Add to favorites
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

  trackByMovieId(_: number, movie: MovieModel): number {
    return movie.id;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getMovieStatusClass(status: string): string {
    switch (status) {
      case 'SHOWING':
        return 'bg-green-600 text-white';
      case 'COMING_SOON':
        return 'bg-blue-600 text-white';
      case 'ENDED':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-green-600 text-white';
    }
  }

  getMovieStatusText(status: string): string {
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
