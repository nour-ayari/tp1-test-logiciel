import { Component, computed, effect, inject, signal } from '@angular/core';
import { CinemaService } from '../../../services/cinema.service';
import { CinemaCard } from '../cinema-card/cinema-card';
import { FormsModule } from '@angular/forms';
import { SearchBar } from '../search-bar/search-bar';
import { Cinema } from '../../../models/cinema.model';

@Component({
  selector: 'app-cinemas',
  imports: [CinemaCard, FormsModule, SearchBar],
  templateUrl: './cinemas.html',
  styleUrl: './cinemas.css',
  standalone: true,
})
export class Cinemas {
  private cinemaService = inject(CinemaService);
  cinemas = signal<Cinema[]>([]);
  error = this.cinemaService.error;
  isLoading = this.cinemaService.isLoading;
  total = this.cinemaService.total;

  hasMore = computed(() => {
    return this.cinemas().length < this.total();
  });

  constructor() {
    effect(() => {
      const loadedCinemas = this.cinemaService.cinemas();

      if (loadedCinemas.length > 0) {
        this.cinemas.update((current) => {
          const ids = new Set(current.map((c) => c.id));
          const merged = [...current];

          for (const cinema of loadedCinemas) {
            if (!ids.has(cinema.id)) {
              merged.push(cinema);
            }
          }

          return merged;
        });
      }
    });
  }

  loadMore() {
    if (!this.hasMore() || this.isLoading()) return;
    this.cinemaService.next();
  }

  showFavoritesOnly = signal(false);

  filteredCinemas = computed(() => {
    const result = this.showFavoritesOnly() ? this.cinemaService.favorites() || [] : this.cinemas();
    return result;
  });

  toggleFavoritesFilter() {
    this.showFavoritesOnly.update((v) => !v);
  }
}
