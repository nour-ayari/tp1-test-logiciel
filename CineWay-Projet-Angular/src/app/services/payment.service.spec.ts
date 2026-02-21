import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { PaymentResponse, Ticket } from '../models/payment.model';
import { environment } from '../../environments/environment';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentService],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should process payment successfully', () => {
    const mockResponse: PaymentResponse = {
      success: true,
      payment_id: 'PAY-TEST123',
      transaction_id: 'TXN-TEST456',
      message: 'Payment successful!',
      tickets: [],
      amount: 20.0,
    };

    service.processPayment(1, [1, 2], 'credit_card').subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/payment/process`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      screening_id: 1,
      seat_ids: [1, 2],
      payment_method: 'credit_card',
    });
    req.flush(mockResponse);
  });

  it('should get payment history', () => {
    const mockTickets: Ticket[] = [
      {
        id: 1,
        user_id: 10,
        screening_id: 100,
        seat_id: 50,
        price: 10.0,
        status: 'confirmed',
        booked_at: '2026-01-27T15:30:00',
        confirmed_at: '2026-01-27T15:30:05',
        payment_id: 'PAY-TEST123',
      },
    ];

    service.getPaymentHistory().subscribe((tickets) => {
      expect(tickets).toEqual(mockTickets);
      expect(tickets.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/payment/history`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTickets);
  });

  it('should get complete payment history', () => {
    const mockTickets: Ticket[] = [];

    service.getCompletePaymentHistory().subscribe((tickets) => {
      expect(tickets).toEqual(mockTickets);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/payment/history/all`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTickets);
  });

  it('should get tickets by payment ID', () => {
    const paymentId = 'PAY-TEST123';
    const mockTickets: Ticket[] = [];

    service.getTicketsByPaymentId(paymentId).subscribe((tickets) => {
      expect(tickets).toEqual(mockTickets);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/payment/ticket/${paymentId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTickets);
  });
});
