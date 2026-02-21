import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, httpResource } from '@angular/common/http';
import CinemaResponse, { Cinema } from '../models/cinema.model';
import { APP_API } from '../config/app-api.config';

@Injectable({
  providedIn: 'root',
})
export class CinemaService {
  readonly limit = 4;
  private skip = signal(0);
  private http = inject(HttpClient);
  private favoritesTrigger = signal(0);

  readonly cinemaResource = httpResource<CinemaResponse>(() => {
    return {
      url: APP_API.cinema.list,
      method: 'GET',
      params: {
        limit: this.limit,
        skip: this.skip(),
      },
    };
  });
  cinemas = computed(() => {
    const value = this.cinemaResource.value();
    return value?.cinemas ?? [];
  });

  total = computed(() => {
    const value = this.cinemaResource.value();
    return value?.total ?? 0;
  });

  error = computed(() => {
    const err = this.cinemaResource.error() as HttpErrorResponse;
    return err;
  });
  isLoading = this.cinemaResource.isLoading;

  next() {
    this.skip.update((s) => s + this.limit);
  }

  searchCinemas(query: string) {
    const params = new HttpParams().set('q', query);
    return this.http.get<Cinema[]>(`${APP_API.cinema.search}`, { params });
  }
  addToFavorites(cinemaId: number) {
    return this.http.post(`${APP_API.cinema.list}${cinemaId}/favorite`, {});
  }
  removeFromFavorites(cinemaId: number) {
    return this.http.delete(`${APP_API.cinema.list}${cinemaId}/favorite`);
  }

  favoriteCinemas = httpResource<Cinema[]>(() => {
    this.favoritesTrigger();
    return {
      url: APP_API.cinema.favorites,
      method: 'GET',
    };
  });
  favorites = computed(() => this.favoriteCinemas.value() ?? []);

  reloadFavorites() {
    this.favoritesTrigger.update((v) => v + 1);
  }

  getCinemaById(id: number) {
    return this.http.get<Cinema>(`${APP_API.cinema.list}${id}`);
  }

  createCinema(payload: any) {
    const preparedPayload = this.prepareCinemaPayload(payload);
    return this.http.post<Cinema>(`${APP_API.cinema.list}`, preparedPayload);
  }

  updateCinema(id: number, payload: any) {
    const preparedPayload = this.prepareCinemaPayload(payload);
    return this.http.put<Cinema>(`${APP_API.cinema.list}${id}`, preparedPayload);
  }

  private prepareCinemaPayload(cinema: any) {
    // Helper function to convert comma-separated string to array
    const stringToArray = (value: string | string[] | null | undefined): string[] | null => {
      if (!value) return null;
      if (Array.isArray(value)) return value;
      return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    };

    return {
      name: cinema.name,
      address: cinema.address,
      city: cinema.city,
      amenities: stringToArray(cinema.amenities) || [],
    };
  }

  getCinemas() {
    return this.http.get<CinemaResponse>(`${APP_API.cinema.list}`);
  }

  deleteCinema(id: number) {
    return this.http.delete(`${APP_API.cinema.list}${id}`);
  }
}
