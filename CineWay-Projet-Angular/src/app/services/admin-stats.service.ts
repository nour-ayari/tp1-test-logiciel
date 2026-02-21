import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { APP_API } from '../config/app-api.config';

type CountResponse = {
  movies_count?: number;
  cinemas_count?: number;
  users_count?: number;
  total_tickets_sold?: number;
};

export type RecentBooking = {
  id: number;
  user_id: number;
  screening_id: number;
  seat_id: number | null;
  price: number;
  status: string;
  booked_at: string;
};

type RecentBookingsResponse = { recent_bookings?: RecentBooking[] };
type TodayStatsResponse = { today_bookings?: number; today_revenue?: number };

@Injectable({ providedIn: 'root' })
export class AdminStatsService {
  private http = inject(HttpClient);

  getMoviesCount(): Observable<number> {
    return this.http.get<CountResponse>(APP_API.admin.stats.movies).pipe(
      map((res) => res.movies_count ?? 0),
      catchError(() => of(0))
    );
  }

  getCinemasCount(): Observable<number> {
    return this.http.get<CountResponse>(APP_API.admin.stats.cinemas).pipe(
      map((res) => res.cinemas_count ?? 0),
      catchError(() => of(0))
    );
  }

  getUsersCount(): Observable<number> {
    return this.http.get<CountResponse>(APP_API.admin.stats.users).pipe(
      map((res) => res.users_count ?? 0),
      catchError(() => of(0))
    );
  }

  getRecentBookingsCount(days = 7): Observable<number> {
    return this.http
      .get<RecentBookingsResponse>(`${APP_API.admin.stats.recentBookings}?days=${days}`)
      .pipe(
        map((res) => res.recent_bookings?.length ?? 0),
        catchError(() => of(0))
      );
  }

  getRecentBookings(days = 7, limit = 10): Observable<RecentBooking[]> {
    return this.http
      .get<RecentBookingsResponse>(
        `${APP_API.admin.stats.recentBookings}?days=${days}&limit=${limit}`
      )
      .pipe(
        map((res) => res.recent_bookings ?? []),
        catchError(() => of([]))
      );
  }

  getTotalTicketsSold(): Observable<number> {
    return this.http.get<CountResponse>(APP_API.admin.stats.totalTickets).pipe(
      map((res) => res.total_tickets_sold ?? 0),
      catchError(() => of(0))
    );
  }

  getTodayStats(): Observable<TodayStatsResponse> {
    return this.http.get<TodayStatsResponse>(APP_API.admin.stats.today).pipe(
      catchError(() => of({ today_bookings: 0, today_revenue: 0 }))
    );
  }
}
