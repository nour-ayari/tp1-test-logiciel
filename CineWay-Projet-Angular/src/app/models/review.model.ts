export interface ReviewCreate {
  rating: number; // 1..5
  title?: string | null;
  comment?: string | null;
}

export interface ReviewUpdate {
  rating: number;
  title: string | null;
  comment: string | null;
}

export interface ReviewRead {
  id: number;
  user_id: number;
  movie_id: number;
  reviewerName: string;
  reviewerAvatar?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  likes: number;
  dislikes: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewListResponse {
  reviews: ReviewRead[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ReviewReaction {
  reaction_type: 'like' | 'dislike';
}

export interface ReviewSummary {
  movie_id: number;
  total_reviews: number;
  average_rating: number;
  rating_breakdown: Record<number, number>;
}
