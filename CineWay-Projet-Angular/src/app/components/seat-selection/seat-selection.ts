import { Component, computed, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { SeatModel } from '../../models/seat.model';
import { httpResource } from '@angular/common/http';
import { APP_API } from '../../config/app-api.config';
import { KeyValuePipe, CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieModel } from '../../models/movie.model';
import { SeatReservationService } from '../../services/seat-reservation.service';
import { ScreeningWebSocketService } from '../../services/screening-websocket.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserApi } from '../../services/user-api';
import { SeatWithStatus } from '../../types/seat-reservation.types';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-seat-selection',
  imports: [KeyValuePipe, CommonModule],
  templateUrl: './seat-selection.html',
  styleUrl: './seat-selection.css',
})
export class SeatSelection implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private seatReservationService = inject(SeatReservationService);
  private wsService = inject(ScreeningWebSocketService);
  private authService = inject(AuthService);
  private userApi = inject(UserApi);

  showtimeId = signal(0);
  movie = signal<MovieModel | null>(null);
  serviceFee = signal(2.0);
  ticketCount = signal(2); // Default to 2 if not passed
  currentUserId = computed(() => this.userApi.user()?.id ?? 0); // Get current user ID for expiration detection

  // Seat reservation state
  seatStatuses = signal<Map<number, SeatWithStatus>>(new Map());
  selectedSeats = signal<Set<number>>(new Set());
  reservationIds = signal<number[]>([]);
  holdExpiresAt = signal<Date | null>(null);
  timeRemaining = signal<number>(0);
  reservationError = signal<string | null>(null);
  isProcessing = signal<boolean>(false);
  wsConnectionStatus = signal<'connected' | 'disconnected' | 'connecting'>('disconnected');
  isNavigatingToPayment = false; // Flag to prevent cleanup when going to payment

  private subscriptions: Subscription[] = [];
  private countdownInterval: any;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.showtimeId.set(Number(id));
    }
    const state = history.state;
    if (state?.movie) {
      this.movie.set(state.movie);
    }
    if (state?.ticketCount) {
      this.ticketCount.set(state.ticketCount);
    }
  }

  ngOnInit(): void {
    this.loadSeatAvailability();
    this.setupWebSocket();
    this.startCountdownTimer();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.wsService.disconnect();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // ✅ Auto-cleanup: Cancel ALL user's reservations for this screening
    // BUT only if not navigating to payment (we want to keep reservations for checkout)
    const screeningId = this.showtimeId();
    if (screeningId && this.selectedSeats().size > 0 && !this.isNavigatingToPayment) {
      this.seatReservationService.cancelReservation(screeningId).subscribe({
        next: () => {},
        error: (err) => {},
      });
    }
  }

  /**
   * Load seat availability from API (uses /availability/me for authenticated users)
   */
  loadSeatAvailability(): void {
    const screeningId = this.showtimeId();
    if (!screeningId) return;

    // Use the authenticated endpoint to get is_mine info
    this.seatReservationService.getSeatAvailabilityForUser(screeningId).subscribe({
      next: (response) => {
        const statusMap = new Map<number, SeatWithStatus>();
        const mySeats = new Set<number>(); // Track user's own reservations

        // Check if response has seats array
        if (response && response.seats && Array.isArray(response.seats)) {
          response.seats.forEach((seat) => {
            statusMap.set(seat.seat_id, seat);

            // If this seat is reserved by the current user, add to selectedSeats
            if (seat.is_mine || seat.status === 'reserved_by_me') {
              mySeats.add(seat.seat_id);
            }
          });
        }

        this.seatStatuses.set(statusMap);

        // Restore user's own reservations to selectedSeats
        if (mySeats.size > 0) {
          this.selectedSeats.set(mySeats);
        }
      },
      error: (err) => {
        this.reservationError.set('Failed to load seat availability');
      },
    });
  }

  /**
   * Setup WebSocket connection for real-time updates
   */
  setupWebSocket(): void {
    const screeningId = this.showtimeId();
    const token = this.authService.getToken();

    if (!screeningId || !token) return;

    this.wsService.connect(screeningId, token);

    // Track connection status
    const connectionSub = this.wsService.getConnectionStatus().subscribe({
      next: (status) => {
        this.wsConnectionStatus.set(status);
      },
    });
    this.subscriptions.push(connectionSub);

    const seatUpdatesSub = this.wsService.getSeatUpdates().subscribe({
      next: (event) => {
        // Create a NEW Map to trigger signal update
        const currentMap = this.seatStatuses();
        const statusMap = new Map(currentMap);
        const existingSeat = statusMap.get(event.seat_id);

        // Determine the effective status based on is_mine flag from WebSocket
        // The backend now sends is_mine: true/false personalized for each connected user
        let effectiveStatus = event.status;
        if (event.is_mine && (event.status === 'reserved' || event.status === 'held')) {
          effectiveStatus = 'reserved_by_me';
        }

        const updatedSeat: SeatWithStatus = {
          seat_id: event.seat_id,
          status: effectiveStatus,
          held_by_user: event.user_id,
          is_mine: event.is_mine ?? false,
          expires_at: event.expires_at,
          row_label: existingSeat?.row_label,
          seat_number: existingSeat?.seat_number,
          seat_type: existingSeat?.seat_type,
        };

        statusMap.set(event.seat_id, updatedSeat);

        // CRITICAL: Set the new Map reference to trigger Angular signals update
        this.seatStatuses.set(statusMap);

        // Handle selection updates based on is_mine
        const selected = new Set(this.selectedSeats());

        if (event.is_mine) {
          // This is our own reservation from another tab/device or from server confirmation
          if (
            event.status === 'reserved' ||
            event.status === 'held' ||
            event.status === 'reserved_by_me'
          ) {
            selected.add(event.seat_id);
          } else if (event.status === 'available') {
            selected.delete(event.seat_id);

            // If this was an expiration (not manual cancel), clear timer state
            if (event.previously_reserved_by) {
              this.holdExpiresAt.set(null);
              this.reservationIds.set([]);
              this.timeRemaining.set(0);
              this.reservationError.set(
                `Your reservation for seat ${event.seat_id} has expired. Please select again.`,
              );
            }
          }
        } else {
          // Check if this seat became available and was previously reserved by me (expiration case)
          if (
            event.status === 'available' &&
            event.previously_reserved_by === this.currentUserId() &&
            selected.has(event.seat_id)
          ) {
            selected.delete(event.seat_id);
            this.reservationError.set(
              `Your reservation for seat ${event.seat_id} has expired. Please select again.`,
            );

            // Clear holdExpiresAt and reservation IDs to stop countdown timer
            this.holdExpiresAt.set(null);
            this.reservationIds.set([]);
            this.timeRemaining.set(0);
          }
          // If a seat we thought was ours is now taken by someone else, remove it
          else if (
            (event.status === 'booked' || event.status === 'reserved' || event.status === 'held') &&
            selected.has(event.seat_id)
          ) {
            selected.delete(event.seat_id);
          }
        }

        this.selectedSeats.set(selected);
      },
      error: (err) => {},
    });

    this.subscriptions.push(seatUpdatesSub);
  }

  /**
   * Start countdown timer for held seats
   */
  startCountdownTimer(): void {
    this.countdownInterval = setInterval(() => {
      const expiresAt = this.holdExpiresAt();

      if (!expiresAt) {
        this.timeRemaining.set(0);
        return;
      }

      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      const secondsRemaining = Math.floor(diff / 1000);

      if (diff <= 0) {
        this.timeRemaining.set(0);
        // Set holdExpiresAt to null first to prevent multiple calls
        this.holdExpiresAt.set(null);
        this.handleReservationExpired();
      } else {
        this.timeRemaining.set(secondsRemaining);
      }
    }, 1000);
  }

  /**
   * Handle reservation expiration
   */
  handleReservationExpired(): void {
    // Get all currently selected seats to update their status
    const expiredSeats = this.selectedSeats();

    if (expiredSeats.size === 0) {
      return;
    }

    const screeningId = this.showtimeId();

    // IMPORTANT: Call the cancel API to immediately notify other users via WebSocket
    // This ensures all users see the seats become available at the same time
    if (screeningId) {
      this.seatReservationService.cancelReservation(screeningId).subscribe({
        next: (response) => {},
        error: (err) => {},
      });
    }

    // Update the seatStatuses map to mark expired seats as available
    const currentMap = this.seatStatuses();
    const statusMap = new Map(currentMap);

    expiredSeats.forEach((seatId) => {
      const existingSeat = statusMap.get(seatId);
      if (existingSeat) {
        statusMap.set(seatId, {
          ...existingSeat,
          status: 'available',
          held_by_user: undefined,
          is_mine: false,
          expires_at: undefined,
        });
      }
    });

    // Update the status map to trigger UI update
    this.seatStatuses.set(statusMap);

    // Clear all selection state
    this.selectedSeats.set(new Set());
    this.reservationIds.set([]);
    this.holdExpiresAt.set(null);
    this.timeRemaining.set(0);
    this.reservationError.set('Your reservation has expired. Please select seats again.');
  }

  showtimeResource = httpResource(() => {
    const id = this.showtimeId();
    if (!id || id === 0) return undefined;
    return {
      url: `${APP_API.showtimes}/${id}`,
      method: 'GET',
    };
  });

  room_id = computed(() => {
    const st = this.showtimeResource.value() as any;
    return st?.room_id || 0;
  });

  seatsResource = httpResource<SeatModel[]>(() => {
    const roomId = this.room_id();
    if (!roomId || roomId === 0) return undefined;
    return {
      url: `${APP_API.rooms.list}/${roomId}/seats`,
      method: 'GET',
    };
  });

  availableSeatsResource = httpResource<SeatModel[]>(() => {
    const id = this.showtimeId();
    if (!id || id === 0) return undefined;
    return {
      url: `${APP_API.showtimes}/${id}/seats`,
      method: 'GET',
    };
  });

  seats = computed(() => this.seatsResource.value() ?? []);
  availableSeats = computed(() => this.availableSeatsResource.value() ?? []);

  /**
   * Get seat status (available, held, booked, reserved_by_me)
   * Maps backend statuses to display statuses
   */
  getSeatStatus(seatId: number): 'available' | 'held' | 'booked' | 'reserved_by_me' {
    const statusData = this.seatStatuses().get(seatId);
    const rawStatus = statusData?.status ?? 'available';
    const isMine = statusData?.is_mine ?? false;

    // Map statuses appropriately
    let finalStatus: 'available' | 'held' | 'booked' | 'reserved_by_me';

    if (
      rawStatus === 'reserved_by_me' ||
      (isMine && (rawStatus === 'reserved' || rawStatus === 'held'))
    ) {
      // User's own reservation
      finalStatus = 'reserved_by_me';
    } else if (rawStatus === 'reserved' || rawStatus === 'held') {
      // Someone else's reservation
      finalStatus = 'held';
    } else if (rawStatus === 'booked') {
      finalStatus = 'booked';
    } else {
      finalStatus = 'available';
    }

    return finalStatus;
  }

  /**
   * Check if seat is available for selection
   * Own reservations (reserved_by_me) are clickable to unreserve
   */
  isAvailable(seatId: number): boolean {
    const status = this.getSeatStatus(seatId);
    // Available seats can be selected, own reservations can be clicked to unreserve
    return status === 'available' || status === 'reserved_by_me';
  }

  /**
   * Check if seat is reserved by current user (from backend is_mine or local selection)
   */
  isReservedByMe(seatId: number): boolean {
    const statusData = this.seatStatuses().get(seatId);
    return statusData?.is_mine === true || statusData?.status === 'reserved_by_me';
  }

  /**
   * Check if seat is selected by current user
   */
  isSelected(seatId: number): boolean {
    return this.selectedSeats().has(seatId);
  }

  /**
   * Get tooltip text for a seat
   */
  getSeatTooltip(seat: SeatModel): string {
    const seatLabel = `${seat.row_label}${seat.seat_number}`;
    const status = this.getSeatStatus(seat.id);
    const isMySelection = this.isSelected(seat.id);

    if (isMySelection || status === 'reserved_by_me') {
      return `${seatLabel} - Your seat (click to cancel)`;
    }

    switch (status) {
      case 'held':
        return `${seatLabel} - Reserved by another user`;
      case 'booked':
        return `${seatLabel} - Sold`;
      case 'available':
      default:
        return `${seatLabel} - Available`;
    }
  }

  /**
   * Get selected seats with details for display
   */
  selectedSeatsArray = computed(() => {
    const selected = Array.from(this.selectedSeats());
    const allSeats = this.seats();
    const statusMap = this.seatStatuses();

    return selected
      .map((seatId) => {
        const seat = allSeats.find((s) => s.id === seatId);
        const status = statusMap.get(seatId);

        if (!seat) return null;

        return {
          seat_id: seatId,
          label: `${seat.row_label}${seat.seat_number}`,
          type: status?.seat_type || seat.seat_type || 'standard',
          price: (status?.seat_type || seat.seat_type) === 'recliner' ? 18 : 12,
        };
      })
      .filter((seat) => seat !== null)
      .sort((a, b) => a!.label.localeCompare(b!.label));
  });

  seatsByRow = computed(() => {
    return this.seats().reduce(
      (acc, seat) => {
        if (!acc[seat.row_label]) acc[seat.row_label] = [];
        acc[seat.row_label].push(seat);
        return acc;
      },
      {} as Record<string, SeatModel[]>,
    );
  });

  /**
   * Toggle seat selection using the new /toggle endpoint
   */
  toggleSeat(seat: SeatModel): void {
    const seatId = seat.id;
    const seatLabel = `${seat.row_label}${seat.seat_number}`;
    const screeningId = this.showtimeId();

    if (!screeningId) return;

    // Check seat status
    const status = this.getSeatStatus(seatId);
    const isMine = this.isReservedByMe(seatId);

    // Check if seat is held by another user (not available and not ours)
    if (status === 'held') {
      this.reservationError.set(`Seat ${seatLabel} is currently reserved by another user`);
      return;
    }

    // Check if seat is booked
    if (status === 'booked') {
      this.reservationError.set(`Seat ${seatLabel} is already booked`);
      return;
    }

    // Check if processing
    if (this.isProcessing()) {
      return;
    }

    const isCurrentlySelected = this.isSelected(seatId);

    // If not selected and would exceed limit, show error
    // (also allow clicking on reserved_by_me seats to unreserve)
    if (!isCurrentlySelected && !isMine && this.selectedSeats().size >= this.ticketCount()) {
      this.reservationError.set(`You can only select ${this.ticketCount()} seats`);
      return;
    }

    this.isProcessing.set(true);
    this.reservationError.set(null);

    this.seatReservationService
      .toggleSeatReservation({
        screening_id: screeningId,
        seat_id: seatId,
      })
      .subscribe({
        next: (response) => {
          this.isProcessing.set(false);

          const selected = new Set(this.selectedSeats());

          if (response.action === 'reserved') {
            // Seat was reserved
            selected.add(seatId);
            this.selectedSeats.set(selected);

            // Calculate expiration time - use either reservation.expires_at or expires_in_minutes
            let expiresAt: Date | null = null;

            if (response.reservation?.expires_at) {
              // Response includes full reservation object with expires_at
              expiresAt = new Date(response.reservation.expires_at);
              const currentIds = this.reservationIds();
              this.reservationIds.set([...currentIds, response.reservation.id]);
            } else if (response.expires_in_minutes) {
              // Response only includes expires_in_minutes - calculate expiration time
              expiresAt = new Date(Date.now() + response.expires_in_minutes * 60 * 1000);

              // If seat_ids are included in response, use those as reservation IDs
              // Otherwise use the seat_id as a fallback identifier
              const idsToAdd = response.seat_ids || [seatId];
              const currentIds = this.reservationIds();
              this.reservationIds.set([...currentIds, ...idsToAdd]);
            }

            if (expiresAt) {
              this.holdExpiresAt.set(expiresAt);
            } else {
              // Fallback: Set 5 minute expiration
              expiresAt = new Date(Date.now() + 5 * 60 * 1000);
              this.holdExpiresAt.set(expiresAt);
            }

            //Mark seat as reserved_by_me
            const statusMap = new Map(this.seatStatuses());
            const existingSeat = statusMap.get(seatId);
            statusMap.set(seatId, {
              ...existingSeat,
              seat_id: seatId,
              status: 'reserved_by_me',
              is_mine: true,
              expires_at: expiresAt?.toISOString(),
              held_by_user: response.reservation?.user_id,
            } as SeatWithStatus);
            this.seatStatuses.set(statusMap);
          } else if (response.action === 'unreserved') {
            // Seat was unreserved
            selected.delete(seatId);
            this.selectedSeats.set(selected);

            // Remove seat ID from reservationIds
            const idsToRemove = response.seat_ids || [seatId];
            const currentIds = this.reservationIds();
            this.reservationIds.set(currentIds.filter((id) => !idsToRemove.includes(id)));

            //Mark seat as available
            const statusMap = new Map(this.seatStatuses());
            const existingSeat = statusMap.get(seatId);
            statusMap.set(seatId, {
              ...existingSeat,
              seat_id: seatId,
              status: 'available',
              is_mine: false,
              expires_at: undefined,
              held_by_user: undefined,
            } as SeatWithStatus);
            this.seatStatuses.set(statusMap);

            // If no seats left, clear reservation state
            if (selected.size === 0) {
              this.reservationIds.set([]);
              this.holdExpiresAt.set(null);
            }
          }
        },
        error: (err) => {
          this.isProcessing.set(false);

          // ⚡ Optimistic update on conflict: mark as held by others
          if (err.status === 409) {
            const statusMap = new Map(this.seatStatuses());
            const existingSeat = statusMap.get(seatId);
            statusMap.set(seatId, {
              ...existingSeat,
              seat_id: seatId,
              status: 'held',
              is_mine: false,
              held_by_user: undefined,
            } as SeatWithStatus);
            this.seatStatuses.set(statusMap);

            // Reload to sync with backend
            setTimeout(() => this.loadSeatAvailability(), 100);
          }

          const errorMessage =
            err.error?.detail || err.error?.message || 'Failed to toggle seat. Please try again.';
          this.reservationError.set(errorMessage);
        },
      });
  }

  /**
   * Cancel reservation
   */
  cancelReservation(): void {
    const screeningId = this.showtimeId();
    if (!screeningId) return;

    this.seatReservationService.cancelReservation(screeningId).subscribe({
      next: (response) => {
        // Backend returns { message: "..." }
        this.selectedSeats.set(new Set());
        this.reservationIds.set([]);
        this.holdExpiresAt.set(null);
        this.reservationError.set(null);

        // Reload availability
        this.loadSeatAvailability();
      },
      error: (err) => {},
    });
  }

  /**
   * Extend reservation time
   */
  extendReservation(): void {
    const ids = this.reservationIds();
    if (ids.length === 0) return;

    this.seatReservationService
      .extendReservation({
        reservation_ids: ids,
        extra_minutes: 5,
      })
      .subscribe({
        next: (response) => {
          // Backend returns { id, expires_at }
          if (response.expires_at) {
            const expiresAt = new Date(response.expires_at);
            this.holdExpiresAt.set(expiresAt);
            this.reservationError.set(null);
          }
        },
        error: (err) => {
          this.reservationError.set('Failed to extend reservation time');
        },
      });
  }

  calculateTicketsTotal(): string {
    const seats = this.selectedSeatsArray();
    const total = seats.reduce((sum, seat) => {
      return sum + (seat?.price || 12);
    }, 0);
    return total.toFixed(2);
  }

  calculateTotal(): string {
    const ticketsTotal = parseFloat(this.calculateTicketsTotal());
    const total = ticketsTotal + this.serviceFee();
    return total.toFixed(2);
  }

  /**
   * Format time remaining as MM:SS
   */
  formatTimeRemaining(): string {
    const seconds = this.timeRemaining();
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  goBack() {
    this.location.back();
  }

  proceedToPayment() {
    const ids = this.reservationIds();

    if (ids.length === 0) {
      this.reservationError.set('Please select seats first');
      return;
    }

    if (this.selectedSeats().size === 0) {
      this.reservationError.set('No seats selected');
      return;
    }

    // Set flag to prevent ngOnDestroy from cancelling reservations
    this.isNavigatingToPayment = true;

    const paymentState = {
      reservationIds: ids,
      screeningId: this.showtimeId(),
      movie: this.movie(),
      selectedSeats: this.selectedSeatsArray(),
      total: parseFloat(this.calculateTicketsTotal()), // Pass numeric total (without service fee - payment page adds it)
      expiresAt: this.holdExpiresAt(),
    };

    // Navigate to payment with reservation IDs
    this.router.navigate(['/payment'], {
      state: paymentState,
    });
  }
}
