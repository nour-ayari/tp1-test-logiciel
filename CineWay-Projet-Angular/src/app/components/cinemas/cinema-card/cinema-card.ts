import { ChangeDetectionStrategy, Component, input, computed, inject } from '@angular/core';
import { Cinema } from '../../../models/cinema.model';
import { formatName, getIconAmenity } from '../../../config/amenities.config';
import { RouterLink } from '@angular/router';
import { APP_ROUTES } from '../../../config/app-routes.confg';
import { CinemaService } from '../../../services/cinema.service';

@Component({
  selector: 'app-cinema-card',
  imports: [RouterLink],
  templateUrl: './cinema-card.html',
  styleUrl: './cinema-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CinemaCard {
  route = APP_ROUTES.cinemas;
  cinema = input.required<Cinema>();
  private cinemaService = inject(CinemaService);

  isFavorite = computed(() =>
    this.cinemaService.favorites().some((f) => f.id === this.cinema().id),
  );

  getIcon(amenity: string): string {
    return getIconAmenity(amenity);
  }
  formatAmenityName(amenity: string): string {
    return formatName(amenity);
  }

  toggleFavorite(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.isFavorite()) {
      this.cinemaService.removeFromFavorites(this.cinema().id).subscribe({
        next: () => {
          this.cinemaService.reloadFavorites();
        },
        error: (err: any) => {
          console.error('Error removing cinema from favorites:', err);
        },
      });
    } else {
      this.cinemaService.addToFavorites(this.cinema().id).subscribe({
        next: () => {
          this.cinemaService.reloadFavorites();
        },
        error: (err: any) => {
          console.error('Error adding cinema to favorites:', err);
        },
      });
    }
  }
}
