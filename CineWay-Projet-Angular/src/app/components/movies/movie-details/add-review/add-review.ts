import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
  effect,
  input,
} from '@angular/core';
import { ReviewCreate, ReviewRead } from '../../../../models/review.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-review',
  imports: [FormsModule],
  templateUrl: './add-review.html',
  styleUrl: './add-review.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddReview {
  open = input.required<boolean>();

  movieTitle = input<string>();

  initialData = input<ReviewRead | null>(null);

  isEditing = input<boolean>(false);

  @Output() submitReview = new EventEmitter<ReviewCreate>();
  @Output() close = new EventEmitter<void>();

  submitting = signal(false);
  errorMsg = signal<string | null>(null);

  rating = signal<number>(0);
  title = signal<string>('');
  comment = signal<string>('');
  hoverRating = signal<number>(0);

  constructor() {
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.rating.set(data.rating);
        this.title.set(data.title || '');
        this.comment.set(data.comment || '');
        this.hoverRating.set(0);
      } else {
        this.reset();
      }
    });
  }

  setRating(v: number) {
    this.rating.set(v);
  }

  onStarHover(rating: number) {
    this.hoverRating.set(rating);
  }

  onStarLeave() {
    this.hoverRating.set(0);
  }

  reset() {
    this.errorMsg.set(null);
    this.rating.set(0);
    this.title.set('');
    this.comment.set('');
    this.hoverRating.set(0);
  }

  onClose() {
    if (this.submitting()) return;
    this.close.emit();
  }

  onSubmit() {
    this.errorMsg.set(null);

    if (this.rating() < 1 || this.rating() > 5) {
      this.errorMsg.set('Please select a rating (1 to 5).');
      return;
    }

    const payload: ReviewCreate = {
      rating: this.rating(),
      title: this.title().trim() || null,
      comment: this.comment().trim() || null,
    };

    this.submitReview.emit(payload);
  }
}
