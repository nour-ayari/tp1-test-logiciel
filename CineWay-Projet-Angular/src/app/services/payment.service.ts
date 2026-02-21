import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaymentRequest, PaymentResponse, Ticket } from '../models/payment.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payment`;

  /**
   * Process payment for reserved seats
   * Converts seat reservations to confirmed tickets
   * Has 95% success rate, 5% failure rate (simulated by backend)
   */
  processPayment(
    screeningId: number,
    seatIds: number[],
    paymentMethod: string = 'credit_card',
  ): Observable<PaymentResponse> {
    const request: PaymentRequest = {
      screening_id: screeningId,
      seat_ids: seatIds,
      payment_method: paymentMethod,
    };

    return this.http.post<PaymentResponse>(`${this.apiUrl}/process`, request);
  }

  /**
   * Get payment history (confirmed and pending tickets only)
   */
  getPaymentHistory(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/history`);
  }

  /**
   * Get complete payment history including cancelled tickets
   */
  getCompletePaymentHistory(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/history/all`);
  }

  /**
   * Get tickets by payment ID
   */
  getTicketsByPaymentId(paymentId: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/ticket/${paymentId}`);
  }
}
