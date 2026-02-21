import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { SeatUpdateEvent } from '../types/seat-reservation.types';

@Injectable({
  providedIn: 'root',
})
export class ScreeningWebSocketService {
  private ws: WebSocket | null = null;
  private seatUpdates$ = new Subject<SeatUpdateEvent>();
  private connectionStatus$ = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>(
    'disconnected',
  );

  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds
  private reconnectTimer: any = null;
  private currentScreeningId: number | null = null;
  private currentToken: string | null = null;

  /**
   * Connect to WebSocket for a specific screening
   * ws://localhost:8000/ws/screenings/{screening_id}?token=<JWT>
   */
  connect(screeningId: number, token: string): void {
    // Store for reconnection
    this.currentScreeningId = screeningId;
    this.currentToken = token;

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clear any pending reconnect
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const wsUrl = environment.apiUrl.replace('http', 'ws').replace('/api/v1', '');
    const url = `${wsUrl}/ws/screenings/${screeningId}?token=${token}`;

    this.connectionStatus$.next('connecting');

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.connectionStatus$.next('connected');
        this.reconnectAttempts = 0; // Reset on successful connection
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'seat_update') {
            // Single seat update
            this.seatUpdates$.next(data as SeatUpdateEvent);
          } else if (data.type === 'bulk_seat_update' && Array.isArray(data.updates)) {
            // Bulk seat updates - emit each one individually
            for (const update of data.updates) {
              const seatEvent: SeatUpdateEvent = {
                type: 'seat_update',
                seat_id: update.seat_id,
                status: update.status,
                user_id: update.reserved_by,
                is_mine: update.is_mine,
                expires_at: update.expires_at,
              };
              this.seatUpdates$.next(seatEvent);
            }
          } else {
            console.warn('⚠️ Unknown WebSocket message type:', data);}
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, 'Raw:', event.data);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);};

      this.ws.onclose = (event) => {
        this.connectionStatus$.next('disconnected');
        this.ws = null;

        // Auto-reconnect if not intentionally closed
        if (this.currentScreeningId && this.currentToken && event.code !== 1000) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionStatus$.next('disconnected');
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      if (this.currentScreeningId && this.currentToken) {
        this.connect(this.currentScreeningId, this.currentToken);
      }
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    // Clear reconnection state
    this.currentScreeningId = null;
    this.currentToken = null;
    this.reconnectAttempts = 0;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'User disconnected'); // Normal closure
      this.ws = null;
      this.connectionStatus$.next('disconnected');
    }
  }

  /**
   * Observable for seat updates
   */
  getSeatUpdates(): Observable<SeatUpdateEvent> {
    return this.seatUpdates$.asObservable();
  }

  /**
   * Observable for connection status
   */
  getConnectionStatus(): Observable<'connected' | 'disconnected' | 'connecting'> {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
