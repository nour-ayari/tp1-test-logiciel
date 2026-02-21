import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';

import { rxResource } from '@angular/core/rxjs-interop';
import { MoviesApi } from '../../../services/movies-api';
import { MovieModel } from '../../../models/movie.model';
import { APP_API } from '../../../config/app-api.config';
import { TimeToHoursPipe } from '../../../pipes/time-tohours-pipe';
import { ReviewsService } from '../../../services/reviews-service';
import { ReviewListResponse, ReviewRead } from '../../../models/review.model';
import { map } from 'rxjs/operators';
import { ReviewsSection } from './reviews-section/reviews-section';
import { FavoritesService } from '../../../services/favorites.service';
import { NotificationService, NotificationResponse } from '../../../services/notification.service';

const DEFAULT_TRAILER = 'https://www.youtube-nocookie.com/embed/EP34Yoxs3FQ';

@Component({
  selector: 'app-movie-details',
  templateUrl: './movie-details.html',
  styleUrl: './movie-details.css',
  imports: [TimeToHoursPipe, ReviewsSection, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovieDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private favoritesService = inject(FavoritesService);
  private notificationService = inject(NotificationService);
  isMuted = signal(true);
  isFavorite = signal(false);
  notificationSignedUp = signal(false);
  notificationLoading = signal(false);

  movieId = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  constructor() {
    // Check if movie is in favorites when component loads
    effect(() => {
      const id = this.movieId();
      if (id) {
        this.checkIfFavorite(id);
      }
    });
  }

  private checkIfFavorite(movieId: number) {
    this.favoritesService.getFavoriteMovies().subscribe({
      next: (movies: MovieModel[]) => {
        const isFav = movies.some((m) => m.id === movieId);
        this.isFavorite.set(isFav);
      },
      error: (err: any) => {
        // Handle error silently or show user-friendly message
      },
    });
  }

  movieResource = httpResource<MovieModel>(() => ({
    url: `${APP_API.movies.movies}/${this.movieId()}`,
  }));
  movie = computed(() => {
    const movieData = this.movieResource.value();
    if (!movieData) return movieData;

    return movieData;
  });
  loading = this.movieResource.isLoading;
  error = this.movieResource.error;

  trailerUrl = computed(() => {
    const url = this.movie()?.trailer_url?.trim();
    if (!url) return DEFAULT_TRAILER;

    if (url.includes('youtube.com/embed/')) return url;

    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : DEFAULT_TRAILER;
    }

    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : DEFAULT_TRAILER;
    }

    return url;
  });

  safeTrailerUrl = computed<SafeResourceUrl>(() => {
    const baseUrl = this.trailerUrl();
    const separator = baseUrl.includes('?') ? '&' : '?';
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      baseUrl + separator + 'autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0',
    );
  });
  @ViewChild('ytFrame') ytFrame?: ElementRef<HTMLIFrameElement>;

  private ytCommand(func: 'mute' | 'unMute') {
    const iframe = this.ytFrame?.nativeElement;
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
  }

  toggleSound() {
    const nextMuted = !this.isMuted();
    this.isMuted.set(nextMuted);

    this.ytCommand(nextMuted ? 'mute' : 'unMute');
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    const movieId = this.movieId();
    if (this.isFavorite()) {
      this.favoritesService.removeMovieFromFavorites(movieId).subscribe({
        next: () => {
          this.isFavorite.set(false);
        },
        error: (err: any) => {
          // Handle error silently or show user-friendly message
        },
      });
    } else {
      this.favoritesService.addMovieToFavorites(movieId).subscribe({
        next: () => {
          this.isFavorite.set(true);
        },
        error: (err: any) => {
          // Handle error silently or show user-friendly message
        },
      });
    }
  }

  notifyMe() {
    if (this.notificationLoading()) return;

    const movieId = this.movieId();
    const movieTitle = this.movie()?.title;

    this.notificationLoading.set(true);

    this.notificationService.subscribeToMovie(movieId).subscribe({
      next: (response: NotificationResponse) => {
        this.notificationSignedUp.set(response.subscribed);

        // You could show a toast notification here
        // this.toastr.success(response.message);

        this.notificationLoading.set(false);
      },
      error: (error) => {
        // Handle different error types
        let errorMessage = 'Failed to subscribe to notifications';
        if (error.status === 401) {
          errorMessage = 'Please log in to subscribe to notifications';
        } else if (error.status === 404) {
          errorMessage = 'Movie not found';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        }

        // You could show a toast error here
        // this.toastr.error(errorMessage);

        this.notificationLoading.set(false);
      },
    });
  }

  unsubscribeFromNotifications() {
    if (this.notificationLoading()) return;

    const movieId = this.movieId();
    const movieTitle = this.movie()?.title;

    this.notificationLoading.set(true);

    this.notificationService.unsubscribeFromMovie(movieId).subscribe({
      next: (response: NotificationResponse) => {
        this.notificationSignedUp.set(response.subscribed);

        // You could show a toast notification here
        // this.toastr.success(response.message);

        this.notificationLoading.set(false);
      },
      error: (error) => {
        let errorMessage = 'Failed to unsubscribe from notifications';
        if (error.status === 401) {
          errorMessage = 'Please log in to manage notifications';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        }

        // You could show a toast error here
        // this.toastr.error(errorMessage);

        this.notificationLoading.set(false);
      },
    });
  }

  viewShowtimes() {
    // Navigate to movie showtimes page
    const movieId = this.movieId();
    if (movieId) {
      this.router.navigate(['/movies', movieId, 'showtimes']);
    }
  }
}
