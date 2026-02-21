export interface SeatWithStatus {
  seat_id: number;
  status: 'available' | 'booked' | 'held' | 'reserved' | 'reserved_by_me';
  held_by_user?: number;
  reserved_by?: number; // Alias for held_by_user from new API
  is_mine?: boolean; // Indicates if this reservation belongs to the current user
  expires_at?: string;
  row_label?: string;
  seat_number?: number;
  seat_type?: string;
}

export interface SeatAvailabilityResponse {
  screening_id: number;
  seats: SeatWithStatus[];
}

export interface ReserveSeatRequest {
  screening_id: number;
  seat_ids: number[];
}

export interface ReservationDetail {
  id: number;
  screening_id: number;
  seat_id: number;
  user_id: number;
  status: 'held' | 'booked';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReserveSeatResponse {
  id: number;
  screening_id: number;
  seat_id: number;
  user_id: number;
  status: 'held';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ExtendReservationRequest {
  reservation_ids: number[];
  extra_minutes: number;
}

export interface ExtendReservationResponse {
  id: number;
  expires_at: string;
}

export interface CancelReservationResponse {
  message: string;
}

export interface BookFromReservationRequest {
  reservation_ids: number[];
  payment_id: string;
}

export interface TicketDetail {
  id: number;
  screening_id: number;
  seat_id: number;
  user_id: number;
  reservation_id: number;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BookFromReservationResponse {
  tickets: TicketDetail[];
}

export interface SeatUpdateEvent {
  type: 'seat_update';
  seat_id: number;
  status: 'available' | 'booked' | 'held' | 'reserved' | 'reserved_by_me';
  user_id?: number;
  is_mine?: boolean; // Personalized per-user from WebSocket broadcast
  expires_at?: string;
  previously_reserved_by?: number; // User ID who previously reserved this seat (used for expiration detection)
}

// Toggle endpoint types
export interface ToggleSeatRequest {
  screening_id: number;
  seat_id: number;
}

export interface ToggleSeatResponse {
  action: 'reserved' | 'unreserved';
  message: string;
  seat_ids?: number[];
  expires_in_minutes?: number;
  // Optional - may be included in some responses
  reservation?: ReservationDetail;
}

// Cancel specific seats types
export interface CancelSpecificSeatsRequest {
  screening_id: number;
  seat_ids: number[];
}

export interface CancelSpecificSeatsResponse {
  message: string;
  cancelled_count: number;
}
