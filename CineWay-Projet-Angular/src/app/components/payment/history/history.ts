import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PaymentService } from '../../../services/payment.service';
import { Ticket } from '../../../models/payment.model';

@Component({
  selector: 'app-payment-history',
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class PaymentHistory implements OnInit {
  private router = inject(Router);
  private paymentService = inject(PaymentService);

  tickets = signal<Ticket[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  showCancelled = signal(false);

  // Group tickets by payment_id
  groupedTickets = computed(() => {
    const grouped = new Map<string, Ticket[]>();

    this.tickets().forEach((ticket) => {
      const existing = grouped.get(ticket.payment_id) || [];
      existing.push(ticket);
      grouped.set(ticket.payment_id, existing);
    });

    return Array.from(grouped.entries())
      .map(([payment_id, tickets]) => ({
        payment_id,
        tickets,
        total: tickets.reduce((sum, t) => sum + t.price, 0),
        date: tickets[0].confirmed_at || tickets[0].booked_at,
        status: tickets[0].status,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  ngOnInit() {
    this.loadHistory();
  }

  private loadHistory() {
    const request = this.showCancelled()
      ? this.paymentService.getCompletePaymentHistory()
      : this.paymentService.getPaymentHistory();

    request.subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load payment history');
        this.isLoading.set(false);
      },
    });
  }

  toggleShowCancelled() {
    this.showCancelled.set(!this.showCancelled());
    this.isLoading.set(true);
    this.loadHistory();
  }

  viewTicketDetails(paymentId: string) {
    this.router.navigate(['/payment/confirmation', paymentId]);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'bg-green-900/30 text-green-400';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'cancelled':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-gray-700 text-gray-400';
    }
  }
}
