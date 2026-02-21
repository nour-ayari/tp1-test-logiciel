import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { PaymentService } from '../../services/payment.service';
import { PaymentResponse } from '../../models/payment.model';
import { MovieModel } from '../../models/movie.model';

interface SelectedSeatInfo {
  seat_id: number;
  label: string;
  type: string;
  price: number;
}

interface PaymentState {
  reservationIds: number[];
  screeningId: number;
  movie: MovieModel;
  selectedSeats: SelectedSeatInfo[];
  total: number;
  expiresAt: Date | null;
}

@Component({
  selector: 'app-payment',
  imports: [CommonModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit, OnDestroy {
  private router = inject(Router);
  private location = inject(Location);
  private paymentService = inject(PaymentService);

  // Payment state
  paymentState = signal<PaymentState | null>(null);
  isProcessing = signal(false);
  paymentError = signal<string | null>(null);
  paymentSuccess = signal(false);
  paymentResponse = signal<PaymentResponse | null>(null);

  // Timer for reservation expiry
  timeRemaining = signal<number>(0);
  private countdownInterval: any;

  // Computed values
  movie = computed(() => this.paymentState()?.movie ?? null);
  selectedSeats = computed(() => this.paymentState()?.selectedSeats ?? []);
  total = computed(() => {
    const stateTotal = this.paymentState()?.total;
    // Handle both string and number types
    if (stateTotal) {
      return typeof stateTotal === 'string' ? parseFloat(stateTotal) : stateTotal;
    }
    // Fallback: calculate from selected seats
    return this.selectedSeats().reduce((sum, seat) => sum + (seat.price || 0), 0);
  });
  serviceFee = computed(() => 2.0);
  finalTotal = computed(() => this.total() + this.serviceFee());
  ticketCount = computed(() => this.selectedSeats().length);

  ngOnInit() {
    // Get state from history.state - this is set by Angular router when using state: {}
    const historyState = history.state;

    console.log('Payment ngOnInit - history.state:', historyState);

    // Check if we have the required data
    if (
      historyState &&
      historyState.screeningId &&
      historyState.selectedSeats &&
      historyState.selectedSeats.length > 0
    ) {
      this.paymentState.set({
        reservationIds: historyState.reservationIds || [],
        screeningId: historyState.screeningId,
        movie: historyState.movie,
        selectedSeats: historyState.selectedSeats,
        total: historyState.total || 0,
        expiresAt: historyState.expiresAt,
      });

      console.log('Payment state set:', this.paymentState());

      // Start countdown timer if expiry time exists
      if (historyState.expiresAt) {
        this.startCountdownTimer(new Date(historyState.expiresAt));
      }
    } else {
      console.log('No valid payment state found, redirecting...');
      // No valid state, redirect back
      this.paymentError.set('No booking information found. Please select seats first.');
      setTimeout(() => {
        this.router.navigate(['/movies']);
      }, 2000);
    }
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private startCountdownTimer(expiresAt: Date) {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = expiresAt.getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      this.timeRemaining.set(remaining);

      if (remaining === 0) {
        clearInterval(this.countdownInterval);
        this.handleReservationExpired();
      }
    };

    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 1000);
  }

  private handleReservationExpired() {
    this.paymentError.set('Your seat reservation has expired. Please select seats again.');

    setTimeout(() => {
      this.router.navigate(['/screenings', this.paymentState()?.screeningId]);
    }, 3000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  processPayment() {
    const state = this.paymentState();
    if (!state) return;

    this.isProcessing.set(true);
    this.paymentError.set(null);

    const seatIds = state.selectedSeats.map((seat) => seat.seat_id);

    this.paymentService.processPayment(state.screeningId, seatIds, 'credit_card').subscribe({
      next: (response) => {
        this.isProcessing.set(false);
        this.paymentResponse.set(response);

        if (response.success) {
          this.paymentSuccess.set(true);

          // Clear countdown timer
          if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
          }

          // Navigate to confirmation page after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/payment/confirmation', response.payment_id]);
          }, 2000);
        } else {
          this.paymentError.set(response.message);
        }
      },
      error: (err) => {
        this.isProcessing.set(false);

        if (err.status === 400) {
          const errorMsg =
            err.error?.detail || 'Your reservations have expired. Please select seats again.';
          this.paymentError.set(errorMsg);

          // Redirect to seat selection after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/screenings', state.screeningId]);
          }, 3000);
        } else {
          this.paymentError.set(
            'An error occurred while processing your payment. Please try again.',
          );
        }
      },
    });
  }

  goBack() {
    if (!this.paymentSuccess()) {
      this.location.back();
    }
  }

  getSeatLabel(seat: SelectedSeatInfo): string {
    return seat.label;
  }
}
