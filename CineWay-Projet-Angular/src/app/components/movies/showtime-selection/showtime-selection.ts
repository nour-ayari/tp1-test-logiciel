import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScreeningService, Screening } from '../../../services/screening.service';
import { TicketTotalPipe } from '../../../pipes/ticket-total.pipe';
import { ShowtimeDatePipe } from '../../../pipes/showtime-date.pipe';

interface TicketType {
  id: string;
  name: string;
  description?: string;
  ageRange?: string;
  price: number;
  count: number;
}

@Component({
  selector: 'app-showtime-selection',
  imports: [CommonModule, TicketTotalPipe, ShowtimeDatePipe],
  templateUrl: './showtime-selection.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowtimeSelectionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private screeningService = inject(ScreeningService);
  private destroyRef = inject(DestroyRef);

  // Route parameters
  screeningId = signal<number | null>(null);

  // Data
  screening = signal<Screening | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Ticket types
  ticketTypes = signal<TicketType[]>([
    {
      id: 'adult',
      name: 'Adult',
      ageRange: 'Ages 18+',
      description: 'Standard adult ticket',
      price: 15.0,
      count: 0,
    },
    {
      id: 'child',
      name: 'Child',
      ageRange: 'Ages 3-11',
      description: 'Discounted rate for children',
      price: 12.0,
      count: 0,
    },
    {
      id: 'student',
      name: 'Student',
      ageRange: 'Ages 12-17',
      description: 'Student discount with valid ID',
      price: 13.0,
      count: 0,
    },
    {
      id: 'senior',
      name: 'Senior',
      ageRange: 'Ages 60+',
      description: 'Senior citizen discount',
      price: 13.0,
      count: 0,
    },
  ]);

  // Computed values
  bookingFee = computed(() => 3.0);

  subtotal = computed(() => {
    return this.ticketTypes().reduce((sum, ticket) => sum + ticket.price * ticket.count, 0);
  });

  totalTickets = computed(() => {
    return this.ticketTypes().reduce((sum, ticket) => sum + ticket.count, 0);
  });

  total = computed(() => {
    return this.subtotal() + (this.totalTickets() > 0 ? this.bookingFee() : 0);
  });

  canProceed = computed(() => this.totalTickets() > 0);

  // Format date helper
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  }
  // Format time helper
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  ngOnInit(): void {
    // Subscribe to route parameter changes to handle navigation to different screenings
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');

      if (!id) {
        this.router.navigate(['/explore']);
        return;
      }

      const numericId = Number(id);

      if (isNaN(numericId) || numericId <= 0) {
        this.error.set('Invalid screening ID');
        return;
      }

      // Only reload if the screening ID has actually changed
      if (this.screeningId() !== numericId) {
        this.screeningId.set(numericId);
        this.loadScreening();
      }
    });
  }

  private loadScreening(): void {
    const id = this.screeningId();
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);

    this.screeningService
      .getScreening(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (screening) => {
          this.screening.set(screening);
          this.loading.set(false);

          // Update ticket prices from screening if available
          if (screening.price) {
            this.ticketTypes.update((types) =>
              types.map((type) => ({
                ...type,
                price: type.id === 'adult' ? screening.price : type.price,
              })),
            );
          }
        },
        error: (err) => {
          let errorMessage = 'Failed to load showtime details';

          if (err.status === 0) {
            errorMessage =
              'Cannot connect to server. Please check if the backend server is running and CORS is configured properly.';
          } else if (err.status === 404) {
            errorMessage = 'Showtime not found. This showtime may have been cancelled or removed.';
          } else if (err.status === 500) {
            errorMessage = 'Server error occurred. Please try again later or contact support.';
          } else if (err.status === 403) {
            errorMessage = 'Access denied. Please login and try again.';
          }

          this.error.set(errorMessage);
          this.loading.set(false);
        },
      });
  }

  updateTicketCount(ticketId: string, change: number): void {
    this.ticketTypes.update((types) =>
      types.map((ticket) => {
        if (ticket.id === ticketId) {
          const newCount = Math.max(0, ticket.count + change);
          return { ...ticket, count: newCount };
        }
        return ticket;
      }),
    );
  }

  incrementTicket(ticketId: string): void {
    this.updateTicketCount(ticketId, 1);
  }

  decrementTicket(ticketId: string): void {
    this.updateTicketCount(ticketId, -1);
  }

  getTicketSummary(): { name: string; count: number; price: number }[] {
    return this.ticketTypes()
      .filter((ticket) => ticket.count > 0)
      .map((ticket) => ({
        name: ticket.name,
        count: ticket.count,
        price: ticket.price * ticket.count,
      }));
  }

  goBack(): void {
    window.history.back();
  }

  proceedToSeatSelection(): void {
    if (!this.canProceed()) return;

    const screeningId = this.screeningId();
    if (!screeningId) return;

    // Navigate to seat selection page with state
    this.router.navigate(['/seats', screeningId], {
      state: {
        movie: this.screening()?.movie,
        ticketCount: this.totalTickets(),
      },
    });
  }

  retryLoadScreening(): void {
    this.error.set(null);
    this.loadScreening();
  }
}
