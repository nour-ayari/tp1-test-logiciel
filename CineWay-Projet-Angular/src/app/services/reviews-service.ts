import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_API } from '../config/app-api.config';
import {
  ReviewListResponse,
  ReviewSummary,
  ReviewCreate,
  ReviewRead,
  ReviewUpdate,
  ReviewReaction,
} from '../models/review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  private http = inject(HttpClient);

  getMovieReviews(movieId: number, page = 1, pageSize = 10) {
    return this.http.get<ReviewListResponse>(APP_API.movies.reviews(movieId), {
      params: {
        page,
        page_size: pageSize,
      },
    });
  }

  getReviewSummary(movieId: number) {
    return this.http.get<ReviewSummary>(APP_API.movies.reviewSummary(movieId));
  }

  createReview(movieId: number, payload: ReviewCreate) {
    return this.http.post<ReviewRead>(APP_API.movies.reviews(movieId), payload);
  }

  updateReview(reviewId: number, payload: ReviewUpdate) {
    return this.http.put<ReviewRead>(APP_API.reviews.reviewById(reviewId), payload);
  }

  deleteReview(reviewId: number) {
    return this.http.delete<void>(APP_API.reviews.reviewById(reviewId));
  }

  reactToReview(reviewId: number, reaction: ReviewReaction) {
    return this.http.post<ReviewRead>(APP_API.reviews.reaction(reviewId), reaction);
  }
}
