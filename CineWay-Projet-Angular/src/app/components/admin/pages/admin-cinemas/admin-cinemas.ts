import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchInputComponent } from '../../components/search-input/search-input';
import { PrimaryButtonComponent } from '../../components/primary-button/primary-button';
import { PaginationComponent } from '../../components/pagination/pagination';
import {
  AdminDataTableComponent,
  TableColumn,
  TableAction,
} from '../../components/admin-data-table/admin-data-table';
import { Cinema } from '../../../../models/cinema.model';
import { CinemaService } from '../../../../services/cinema.service';

@Component({
  selector: 'app-admin-cinemas',
  imports: [
    CommonModule,
    SearchInputComponent,
    PrimaryButtonComponent,
    PaginationComponent,
    AdminDataTableComponent,
  ],
  templateUrl: './admin-cinemas.html',
  styleUrls: ['./admin-cinemas.css'],
})
export class AdminCinemasComponent implements OnInit {
  private router = inject(Router);
  private cinemasApi = inject(CinemaService);
  private destroyRef = inject(DestroyRef);

  readonly tableColumns: TableColumn[] = [
    { key: 'name', label: 'Cinema Name', width: '25%' },
    { key: 'city', label: 'City', width: '15%' },
    { key: 'address', label: 'Address', width: '35%' },
    { key: 'contact_number', label: 'Contact', width: '15%' },
  ];

  readonly tableActions: TableAction[] = [
    { type: 'edit', label: 'Edit' },
    { type: 'delete', label: 'Delete' },
  ];

  private readonly pageSize = 5;

  // Signals for state management
  readonly cinemas = signal<Cinema[]>([]);
  readonly searchTerm = signal('');
  readonly page = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filteredCinemas = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    return this.cinemas().filter(
      (cinema) =>
        cinema.name.toLowerCase().includes(q) ||
        cinema.city.toLowerCase().includes(q) ||
        cinema.address.toLowerCase().includes(q),
    );
  });

  readonly totalPages = computed(() => {
    const total = this.filteredCinemas().length;
    return total === 0 ? 1 : Math.ceil(total / this.pageSize);
  });

  readonly paginatedCinemas = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredCinemas().slice(start, start + this.pageSize);
  });

  readonly startIndex = computed(() => {
    const hasItems = this.filteredCinemas().length > 0;
    return hasItems ? (this.page() - 1) * this.pageSize + 1 : 0;
  });

  readonly endIndex = computed(() => {
    const total = this.filteredCinemas().length;
    if (total === 0) {
      return 0;
    }
    return Math.min(this.page() * this.pageSize, total);
  });

  ngOnInit(): void {
    this.loadCinemas();
  }

  private loadCinemas(): void {
    this.loading.set(true);
    this.cinemasApi
      .getCinemas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.cinemas.set(response.cinemas || []);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load cinemas');
          this.loading.set(false);
        },
      });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.page.set(1);
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
    }
  }

  onAddCinema(): void {
    this.router.navigate(['/admin/cinemas/add']);
  }

  onTableAction(event: { action: string; row: Cinema }): void {
    if (event.action === 'edit') {
      this.router.navigate(['/admin/cinemas/edit', event.row.id]);
    } else if (event.action === 'delete') {
      this.onDelete(event.row);
    }
  }

  private onDelete(cinema: Cinema): void {
    const confirmed = confirm(
      `Are you sure you want to delete "${cinema.name}"? This action cannot be undone.`,
    );
    if (!confirmed) return;

    this.cinemasApi
      .deleteCinema(cinema.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.cinemas.update((cinemas) => cinemas.filter((c) => c.id !== cinema.id));
        },
        error: (err) => {
          this.error.set('Failed to delete cinema');
        },
      });
  }
}
