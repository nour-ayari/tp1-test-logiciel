import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_API } from '../config/app-api.config';

export interface Screening {
  id: number;
  movie_id: number;
  room_id: number;
  screening_time: string;
  price: number;
  created_at: string;
  movie?: {
    id: number;
    title: string;
    image_url?: string;
    rating?: string;
    genre?: string[];
  };
  room?: {
    id: number;
    name: string;
    cinema_id: number;
    cinema?: {
      id: number;
      name: string;
    };
  };
}

export interface ScreeningCreate {
  movie_id: number;
  room_id: number;
  screening_time: string;
  price: number;
}

@Injectable({
  providedIn: 'root',
})
export class ScreeningService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${APP_API.screenings}/`;

  getScreenings(params?: {
    movie_id?: number;
    room_id?: number;
    cinema_id?: number;
    date?: string;
    limit?: number;
  }): Observable<Screening[]> {
    let httpParams = new HttpParams();
    if (params?.movie_id) httpParams = httpParams.set('movie_id', params.movie_id.toString());
    if (params?.room_id) httpParams = httpParams.set('room_id', params.room_id.toString());
    if (params?.cinema_id) httpParams = httpParams.set('cinema_id', params.cinema_id.toString());
    if (params?.date) httpParams = httpParams.set('date', params.date);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());

    console.log('Calling screenings API:', this.baseUrl, 'with params:', params);
    return this.http.get<Screening[]>(this.baseUrl, { params: httpParams });
  }

  getScreening(id: number): Observable<Screening> {
    const url = `${this.baseUrl}${id}`;
    return this.http.get<Screening>(url);
  }

  createScreening(screening: ScreeningCreate): Observable<Screening> {
    return this.http.post<Screening>(this.baseUrl, screening);
  }

  updateScreening(id: number, screening: ScreeningCreate): Observable<Screening> {
    return this.http.put<Screening>(`${this.baseUrl}/${id}`, screening);
  }

  deleteScreening(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
