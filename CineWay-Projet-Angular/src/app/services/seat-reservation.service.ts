import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  SeatWithStatus,
  SeatAvailabilityResponse,
  ReserveSeatRequest,
  ReserveSeatResponse,
  ExtendReservationRequest,
  ExtendReservationResponse,
  CancelReservationResponse,
  BookFromReservationRequest,
  BookFromReservationResponse,
  ToggleSeatRequest,
  ToggleSeatResponse,
  CancelSpecificSeatsRequest,
  CancelSpecificSeatsResponse,
} from '../types/seat-reservation.types';

@Injectable({
  providedIn: 'root',
})
export class SeatReservationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/seat-reservations`;

  /**
   * Get seat availability for a screening WITH ownership info (requires auth)
   * GET /seat-reservations/screening/{screening_id}/availability/me
   *
   * This endpoint returns seats with is_mine flag and "reserved_by_me" status
   * for seats reserved by the current authenticated user.
   */
  getSeatAvailabilityForUser(screeningId: number): Observable<SeatAvailabilityResponse> {
    return this.http
      .get<
        SeatWithStatus[] | SeatAvailabilityResponse
      >(`${this.apiUrl}/screening/${screeningId}/availability/me`)
      .pipe(map((response) => this.transformAvailabilityResponse(response, screeningId)));
  }

  /**
   * Get seat availability for a screening (public, no ownership info)
   * GET /seat-reservations/screening/{screening_id}/availability
   *
   * @deprecated Use getSeatAvailabilityForUser() for authenticated users
   * to get proper is_mine distinction.
   */
  getSeatAvailability(screeningId: number): Observable<SeatAvailabilityResponse> {
    return this.http
      .get<
        SeatWithStatus[] | SeatAvailabilityResponse
      >(`${this.apiUrl}/screening/${screeningId}/availability`)
      .pipe(map((response) => this.transformAvailabilityResponse(response, screeningId)));
  }

  /**
   * Transform availability response to consistent format
   */
  private transformAvailabilityResponse(
    response: SeatWithStatus[] | SeatAvailabilityResponse,
    screeningId: number,
  ): SeatAvailabilityResponse {
    // Handle if backend returns array directly instead of wrapped object
    if (Array.isArray(response)) {

      // Transform the response to flatten nested seat object
      const transformedSeats = response.map((item: any) => ({
        seat_id: item.seat?.id ?? item.seat_id,
        status: item.status,
        held_by_user: item.reserved_by ?? item.held_by_user,
        reserved_by: item.reserved_by,
        is_mine: item.is_mine ?? false, // New field from backend
        expires_at: item.expires_at,
        row_label: item.seat?.row_label ?? item.row_label,
        seat_number: item.seat?.seat_number ?? item.seat_number,
        seat_type: item.seat?.seat_type ?? item.seat_type,
      }));


      return {
        screening_id: screeningId,
        seats: transformedSeats,
      };
    }
    return response;
  }

  /**
   * Reserve seats (hold them temporarily) - Creates one reservation per seat
   * POST /seat-reservations/reserve (called multiple times for multiple seats)
   */
  reserveSeats(request: ReserveSeatRequest): Observable<ReserveSeatResponse[]> {
    // Backend creates one reservation per seat, so we need to call the endpoint for each seat
    const reservationRequests = request.seat_ids.map((seatId) =>
      this.http.post<ReserveSeatResponse>(`${this.apiUrl}/reserve`, {
        screening_id: request.screening_id,
        seat_id: seatId,
      }),
    );

    // If no seats to reserve, return empty array
    if (reservationRequests.length === 0) {
      return new Observable((observer) => {
        observer.next([]);
        observer.complete();
      });
    }

    // Return all reservations as an array
    return forkJoin(reservationRequests);
  }

  /**
   * Extend reservation hold time
   * POST /seat-reservations/extend
   */
  extendReservation(request: ExtendReservationRequest): Observable<ExtendReservationResponse> {
    return this.http.post<ExtendReservationResponse>(`${this.apiUrl}/extend`, request);
  }

  /**
   * Cancel reservation (release held seats)
   * DELETE /seat-reservations/cancel/{screening_id}
   * Cancels ALL user's reservations for a screening (used on page refresh/destroy)
   */
  cancelReservation(screeningId: number): Observable<CancelReservationResponse> {
    return this.http.delete<CancelReservationResponse>(`${this.apiUrl}/cancel/${screeningId}`);
  }

  /**
   * Toggle seat reservation (reserve or unreserve in one call)
   * POST /seat-reservations/toggle
   * Recommended for seat click handling - handles reserve/unreserve automatically
   */
  toggleSeatReservation(request: ToggleSeatRequest): Observable<ToggleSeatResponse> {
    return this.http.post<ToggleSeatResponse>(`${this.apiUrl}/toggle`, request);
  }

  /**
   * Cancel specific seats
   * POST /seat-reservations/cancel
   * Cancel specific seats with JSON body
   */
  cancelSpecificSeats(
    request: CancelSpecificSeatsRequest,
  ): Observable<CancelSpecificSeatsResponse> {
    return this.http.post<CancelSpecificSeatsResponse>(`${this.apiUrl}/cancel`, request);
  }

  /**
   * Confirm booking from reservation (after payment)
   * POST /tickets/book-from-reservation
   */
  bookFromReservation(
    request: BookFromReservationRequest,
  ): Observable<BookFromReservationResponse> {
    return this.http.post<BookFromReservationResponse>(
      `${environment.apiUrl}/tickets/book-from-reservation`,
      request,
    );
  }
}
