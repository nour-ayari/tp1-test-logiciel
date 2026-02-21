import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  effect,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, map, throwError } from 'rxjs';
import {
  ReviewCreate,
  ReviewListResponse,
  ReviewRead,
  ReviewSummary,
  ReviewUpdate,
} from '../../../../models/review.model';
import { ReviewsService } from '../../../../services/reviews-service';
import { AddReview } from '../add-review/add-review';
import { DeleteConfirmationModal } from '../delete-confirmation-modal/delete-confirmation-modal';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../auth/services/auth.service';
import { UserApi } from '../../../../services/user-api';

@Component({
  selector: 'app-reviews-section',
  imports: [AddReview, DeleteConfirmationModal, CommonModule],
  templateUrl: './reviews-section.html',
  styleUrl: './reviews-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsSection {
  private reviewsApi = inject(ReviewsService);
  private authService = inject(AuthService);
  private userApi = inject(UserApi);
  movieId = input.required<number>();
  movieTitle = input<string>('');
  modalOpen = signal(false);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  reactingToReview = signal<number | null>(null);
  deletingReview = signal<number | null>(null);
  editingReview = signal(false);
  deleteConfirmationOpen = signal(false);
  pendingDeleteReviewId = signal<number | null>(null);

  // Pagination signals
  currentPage = signal(1);
  readonly pageSize = 15;
  isLoadingMore = signal(false);
  hasMoreReviews = signal(true);

  currentUserId = computed(() => this.userApi.user()?.id || null);

  // Find user's own review
  userReview = computed(() => {
    const userId = this.currentUserId();
    if (!userId) return null;
    return this.reviews().find((r) => r.user_id === userId) || null;
  });

  hasUserReviewed = computed(() => !!this.userReview());

  // Accumulate all loaded reviews
  allReviews = signal<ReviewRead[]>([]);

  reviewsRxResource = rxResource({
    params: () => ({
      movieId: this.movieId(),
      page: this.currentPage(),
      pageSize: this.pageSize,
    }),
    stream: ({ params }) =>
      this.reviewsApi
        .getMovieReviews(params.movieId, params.page, params.pageSize)
        .pipe(map((res: ReviewListResponse) => res.reviews)),
    defaultValue: [] as ReviewRead[],
  });

  // Update allReviews when new reviews are loaded
  constructor() {
    effect(() => {
      const newReviews = this.reviewsRxResource.value();
      if (newReviews.length > 0) {
        if (this.currentPage() === 1) {
          this.allReviews.set(newReviews);
        } else {
          this.allReviews.set([...this.allReviews(), ...newReviews]);
        }

        // Check if there are more reviews to load
        this.hasMoreReviews.set(newReviews.length === this.pageSize);
        this.isLoadingMore.set(false);
      }
    });
  }

  reviews = computed(() => this.allReviews());
  reviewsLoading = computed(() => this.reviewsRxResource.isLoading() && this.currentPage() === 1);
  reviewsError = this.reviewsRxResource.error;

  // Fetch review summary for average rating
  summaryRxResource = rxResource({
    params: () => ({ movieId: this.movieId() }),
    stream: ({ params }) => this.reviewsApi.getReviewSummary(params.movieId),
  });
  reviewSummary = computed(() => this.summaryRxResource.value());
  averageRating = computed(() => this.reviewSummary()?.average_rating ?? 0);
  totalReviews = computed(() => this.reviewSummary()?.total_reviews ?? 0);

  sortedReviews = computed(() => {
    return [...this.reviews()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  });
  reviewIndex = signal(0);

  currentReview = computed(() => this.sortedReviews()[this.reviewIndex()] ?? null);
  hasPrevReview = computed(() => this.reviewIndex() > 0);
  hasNextReview = computed(() => this.reviewIndex() < this.sortedReviews().length - 1);

  prevReview() {
    if (this.hasPrevReview()) this.reviewIndex.update((i) => i - 1);
  }
  nextReview() {
    if (this.hasNextReview()) this.reviewIndex.update((i) => i + 1);
  }

  loadMoreReviews() {
    if (this.isLoadingMore() || !this.hasMoreReviews()) return;

    this.isLoadingMore.set(true);
    this.currentPage.update((page) => page + 1);
  }

  openAddReview() {
    this.editingReview.set(false);
    this.modalOpen.set(true);
  }

  openEditReview() {
    this.editingReview.set(true);
    this.modalOpen.set(true);
  }

  closeAddReview() {
    this.modalOpen.set(false);
    this.editingReview.set(false);
  }

  async handleSubmit(payload: ReviewCreate) {
    this.submitting.set(true);
    this.submitError.set(null);

    const isEditing = this.editingReview();
    const reviewId = this.userReview()?.id;

    const updatePayload: ReviewUpdate = {
      rating: payload.rating,
      title: payload.title ?? null,
      comment: payload.comment ?? null,
    };

    const request$ =
      isEditing && reviewId
        ? this.reviewsApi.updateReview(reviewId, updatePayload)
        : this.reviewsApi.createReview(this.movieId(), payload);

    request$
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const msg =
            err?.error?.detail || `Error while ${isEditing ? 'updating' : 'submitting'} review`;
          const _msg = String(msg).split('.')[0].trim();
          this.submitError.set(_msg);
          this.modalOpen.set(false);
          return throwError(() => err);
        }),
      )
      .subscribe({
        next: () => {
          this.modalOpen.set(false);
          this.editingReview.set(false);
          this.reviewIndex.set(0);
          this.reviewsRxResource.reload();
          this.summaryRxResource.reload();
          this.submitting.set(false);
        },
        error: () => {
          this.submitting.set(false);
        },
      });
  }

  canDeleteReview(review: ReviewRead): boolean {
    return review.user_id === this.currentUserId();
  }

  deleteReview(reviewId: number) {
    this.pendingDeleteReviewId.set(reviewId);
    this.deleteConfirmationOpen.set(true);
  }

  confirmDeleteReview() {
    const reviewId = this.pendingDeleteReviewId();
    if (!reviewId) return;

    this.deleteConfirmationOpen.set(false);
    this.pendingDeleteReviewId.set(null);
    this.deletingReview.set(reviewId);

    this.reviewsApi
      .deleteReview(reviewId)
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const msg = err?.error?.detail || 'Error deleting review';
          this.submitError.set(msg);
          return throwError(() => err);
        }),
      )
      .subscribe({
        next: () => {
          this.reviewsRxResource.reload();
          this.summaryRxResource.reload();
          this.deletingReview.set(null);
          if (this.reviewIndex() >= this.sortedReviews().length - 1) {
            this.reviewIndex.set(Math.max(0, this.sortedReviews().length - 2));
          }
        },
        error: () => {
          this.deletingReview.set(null);
        },
      });
  }

  cancelDeleteReview() {
    this.deleteConfirmationOpen.set(false);
    this.pendingDeleteReviewId.set(null);
  }

  deleteUserReview() {
    const review = this.userReview();
    if (!review) return;
    this.deleteReview(review.id);
  }

  reactToReview(reviewId: number, reactionType: 'like' | 'dislike') {
    this.reactingToReview.set(reviewId);
    this.reviewsApi
      .reactToReview(reviewId, { reaction_type: reactionType })
      .pipe(
        catchError((err: HttpErrorResponse) => {
          const msg = err?.error?.detail || 'Error reacting to review';
          this.submitError.set(msg);
          return throwError(() => err);
        }),
      )
      .subscribe({
        next: () => {
          this.reviewsRxResource.reload();
          this.reactingToReview.set(null);
        },
        error: () => {
          this.reactingToReview.set(null);
        },
      });
  }
}
