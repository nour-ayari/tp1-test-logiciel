import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SeatReservationService } from './seat-reservation.service';
import { environment } from '../../environments/environment';

describe('SeatReservationService', () => {
  let service: SeatReservationService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/seat-reservations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SeatReservationService],
    });
    service = TestBed.inject(SeatReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getSeatAvailability', () => {
    it('should get seat availability for a screening', () => {
      const screeningId = 1;
      const mockResponse = {
        screening_id: 1,
        seats: [
          { seat_id: 1, status: 'available' as const },
          { seat_id: 2, status: 'booked' as const },
        ],
      };

      service.getSeatAvailability(screeningId).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response.seats.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/screening/${screeningId}/availability`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('reserveSeats', () => {
    it('should reserve seats successfully', () => {
      const request = {
        screening_id: 1,
        seat_ids: [1, 2],
      };
      const mockResponses = [
        {
          id: 18,
          screening_id: 1,
          seat_id: 1,
          user_id: 7,
          status: 'held' as const,
          expires_at: '2026-01-26T15:30:00Z',
          created_at: '2026-01-26T15:20:00Z',
          updated_at: '2026-01-26T15:20:00Z',
        },
        {
          id: 19,
          screening_id: 1,
          seat_id: 2,
          user_id: 7,
          status: 'held' as const,
          expires_at: '2026-01-26T15:30:00Z',
          created_at: '2026-01-26T15:20:00Z',
          updated_at: '2026-01-26T15:20:00Z',
        },
      ];

      service.reserveSeats(request).subscribe((reservations) => {
        expect(reservations.length).toBe(2);
        expect(reservations[0].id).toBe(18);
        expect(reservations[0].seat_id).toBe(1);
        expect(reservations[0].status).toBe('held');
      });

      // Expect two separate API calls (one per seat)
      const req1 = httpMock.expectOne(`${apiUrl}/reserve`);
      expect(req1.request.method).toBe('POST');
      expect(req1.request.body).toEqual({ screening_id: 1, seat_id: 1 });
      req1.flush(mockResponses[0]);

      const req2 = httpMock.expectOne(`${apiUrl}/reserve`);
      expect(req2.request.method).toBe('POST');
      expect(req2.request.body).toEqual({ screening_id: 1, seat_id: 2 });
      req2.flush(mockResponses[1]);
    });

    it('should handle reservation failure', () => {
      const request = {
        screening_id: 1,
        seat_ids: [1],
      };

      service.reserveSeats(request).subscribe({
        next: () => fail('Should have failed'),
        error: (err) => {
          expect(err.status).toBe(400);
          expect(err.error.detail).toBe('Seat already reserved');
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/reserve`);
      req.flush({ detail: 'Seat already reserved' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('extendReservation', () => {
    it('should extend reservation successfully', () => {
      const request = {
        reservation_ids: [123],
        extra_minutes: 5,
      };
      const mockResponse = {
        id: 123,
        expires_at: '2026-01-26T15:35:00Z',
      };

      service.extendReservation(request).subscribe((response) => {
        expect(response.id).toBe(123);
        expect(response.expires_at).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/extend`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation successfully', () => {
      const screeningId = 1;
      const mockResponse = {
        message: 'Reservations cancelled successfully',
      };

      service.cancelReservation(screeningId).subscribe((response) => {
        expect(response.message).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/cancel/${screeningId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('bookFromReservation', () => {
    it('should confirm booking from reservation', () => {
      const request = {
        reservation_ids: [123, 124],
        payment_id: 'stripe_abc123',
      };
      const mockResponse = {
        tickets: [
          {
            id: 987,
            screening_id: 1,
            seat_id: 1,
            user_id: 7,
            reservation_id: 123,
            price: 12.0,
            status: 'confirmed',
            created_at: '2026-01-26T15:25:00Z',
            updated_at: '2026-01-26T15:25:00Z',
          },
          {
            id: 988,
            screening_id: 1,
            seat_id: 2,
            user_id: 7,
            reservation_id: 124,
            price: 12.0,
            status: 'confirmed',
            created_at: '2026-01-26T15:25:00Z',
            updated_at: '2026-01-26T15:25:00Z',
          },
        ],
      };

      service.bookFromReservation(request).subscribe((response) => {
        expect(response.tickets).toBeDefined();
        expect(response.tickets.length).toBe(2);
        expect(response.tickets[0].id).toBe(987);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tickets/book-from-reservation`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });
});
