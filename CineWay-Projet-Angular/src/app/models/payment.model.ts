export interface Ticket {
  id: number;
  user_id: number;
  screening_id: number;
  seat_id: number;
  price: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  booked_at: string;
  confirmed_at?: string;
  payment_id: string;
}

export interface PaymentRequest {
  screening_id: number;
  seat_ids: number[];
  payment_method: string;
}

export interface PaymentResponse {
  success: boolean;
  payment_id: string | null;
  transaction_id: string | null;
  message: string;
  tickets: Ticket[] | null;
  amount: number;
}
