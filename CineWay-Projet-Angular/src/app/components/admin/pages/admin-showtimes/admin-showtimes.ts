import { Component, computed, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScreeningService, Screening } from '../../../../services/screening.service';
import {
  AdminDataTableComponent,
  TableColumn,
  TableAction,
} from '../../components/admin-data-table/admin-data-table';
import { PrimaryButtonComponent } from '../../components/primary-button/primary-button';
import { PaginationComponent } from '../../components/pagination/pagination';

@Component({
  selector: 'app-admin-showtimes',
  imports: [CommonModule, AdminDataTableComponent, PrimaryButtonComponent, PaginationComponent],
  templateUrl: './admin-showtimes.html',
  styleUrl: './admin-showtimes.css',
})
export class AdminShowtimesComponent implements OnInit {
  private readonly screeningService = inject(ScreeningService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  showtimes = signal<Screening[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(1);
  itemsPerPage = 10;

  columns: TableColumn[] = [
    { key: 'screening_time', label: 'Date & Time', width: '20%' },
    { key: 'movie.title', label: 'Movie', width: '25%' },
    { key: 'room.name', label: 'Room', width: '15%' },
    { key: 'price', label: 'Price', width: '15%' },
  ];

  actions: TableAction[] = [
    { type: 'edit', label: 'Edit' },
    { type: 'delete', label: 'Delete' },
  ];

  paginatedShowtimes = computed(() => {
    const start = (this.page() - 1) * this.itemsPerPage;
    return this.showtimes().slice(start, start + this.itemsPerPage);
  });

  totalPages = computed(() => Math.ceil(this.showtimes().length / this.itemsPerPage));

  startIndex = computed(() => (this.page() - 1) * this.itemsPerPage + 1);
  endIndex = computed(() => Math.min(this.page() * this.itemsPerPage, this.showtimes().length));

  ngOnInit(): void {
    this.loadShowtimes();
  }

  loadShowtimes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.screeningService
      .getScreenings({ limit: 1000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (showtimes) => {
          this.showtimes.set(showtimes);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.detail || 'Failed to load showtimes');
          this.loading.set(false);
        },
      });
  }

  onAddShowtime(): void {
    this.router.navigate(['/admin/showtimes/add']);
  }

  onAction(event: { action: string; item: Screening }): void {
    if (event.action === 'edit') {
      this.router.navigate(['/admin/showtimes/edit', event.item.id]);
    } else if (event.action === 'delete') {
      this.onDelete(event.item);
    }
  }

  onDelete(showtime: Screening): void {
    if (!confirm(`Are you sure you want to delete this showtime for "${showtime.movie?.title}"?`)) {
      return;
    }

    this.screeningService
      .deleteScreening(showtime.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadShowtimes();
        },
        error: (err) => {
          this.error.set(err.error?.detail || 'Failed to delete showtime');
        },
      });
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
    }
  }
}
