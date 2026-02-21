import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../services/payment.service';
import { Ticket } from '../../../models/payment.model';

@Component({
  selector: 'app-payment-confirmation',
  imports: [CommonModule],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.css',
})
export class PaymentConfirmation implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);

  paymentId = signal<string | null>(null);
  tickets = signal<Ticket[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const paymentId = this.route.snapshot.paramMap.get('paymentId');

    if (!paymentId) {
      this.router.navigate(['/movies']);
      return;
    }

    this.paymentId.set(paymentId);
    this.loadTickets(paymentId);
  }

  private loadTickets(paymentId: string) {
    this.paymentService.getTicketsByPaymentId(paymentId).subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load ticket details');
        this.isLoading.set(false);
      },
    });
  }

  getTotalAmount(): number {
    return this.tickets().reduce((sum, ticket) => sum + ticket.price, 0);
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

  goToMovies() {
    this.router.navigate(['/explore']);
  }

  goToHistory() {
    this.router.navigate(['/profile'], {
      queryParams: { section: 'history' },
    });
  }

  printTickets() {
    window.print();
  }
}
