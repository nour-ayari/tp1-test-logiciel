import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Cinema } from '../../../models/cinema.model';
import { formatName, getIconAmenity } from '../../../config/amenities.config';
import { httpResource } from '@angular/common/http';
import { APP_API } from '../../../config/app-api.config';
import { APP_ROUTES } from '../../../config/app-routes.confg';
import { Showtimes } from '../showtimes/showtimes';
import { ToastrService } from 'ngx-toastr';
import { MoviesList } from '../movies-list/movies-list';
import { MovieModel } from '../../../models/movie.model';
import { CinemaService } from '../../../services/cinema.service';

@Component({
  selector: 'app-cinema-details',
  templateUrl: './cinema-details.html',
  styleUrl: './cinema-details.css',
  imports: [Showtimes, MoviesList],
})
export class CinemaDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cinemaId = signal(Number(this.route.snapshot.paramMap.get('id')));
  private toastr = inject(ToastrService);
  private cinemaService = inject(CinemaService);

  readonly cinemaDetailsRes = httpResource<Cinema>(() => ({
    url: `${APP_API.cinema.list}${this.cinemaId()}`,
    method: 'GET',
  }));

  cinema = computed(() => this.cinemaDetailsRes.value());
  error = computed(() => this.cinemaDetailsRes.error());
  isLoading = computed(() => this.cinemaDetailsRes.isLoading());
  hasValue = computed(() => this.cinemaDetailsRes.hasValue());
  constructor() {
    effect(() => {
      if (this.error()) {
        this.router.navigate([APP_ROUTES.cinemas]);
        this.toastr.error('An error occurred while loading the cinema details');
      }
    });
  }
  isFavorite = computed(() => {
    const favs = this.cinemaService.favorites();
    const cid = this.cinemaId();
    return favs.some((f) => f.id === cid);
  });

  getIcon(amenity: string): string {
    return getIconAmenity(amenity);
  }

  formatAmenityName(amenity: string): string {
    return formatName(amenity);
  }
  goBack() {
    this.router.navigate([APP_ROUTES.cinemas]);
  }

  toggleFavorite() {
    if (this.isFavorite()) {
      this.cinemaService.removeFromFavorites(this.cinemaId()).subscribe({
        next: () => {
          this.cinemaService.favoriteCinemas.reload();
        },
        error: () => {},
      });
    } else {
      this.cinemaService.addToFavorites(this.cinemaId()).subscribe({
        next: () => {
          this.cinemaService.favoriteCinemas.reload();
        },
        error: () => {},
      });
    }
  }
}
