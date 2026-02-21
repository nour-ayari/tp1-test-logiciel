import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { APP_ROUTES } from '../../config/app-routes.confg';
import { AuthService } from '../../auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { UserApi } from '../../services/user-api';
import { AbstractControl, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
} from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { MoviesApi } from '../../services/movies-api';
import { CinemaService } from '../../services/cinema.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar-component',
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule, CommonModule],
  templateUrl: './navbar-component.html',
  styleUrl: './navbar-component.css',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastrService = inject(ToastrService);
  private formBuilder = inject(FormBuilder);
  private moviesApi = inject(MoviesApi);
  private cinemaService = inject(CinemaService);
  private elementRef = inject(ElementRef);

  APP_ROUTES = APP_ROUTES;
  menuOpen = false;
  userApi = inject(UserApi);
  searchDropdownOpen = false;

  // Filter state: 'all', 'movies', 'cinemas'
  searchFilter = signal<'all' | 'movies' | 'cinemas'>('all');

  // Search form
  searchForm = this.formBuilder.group({ search: [''] });

  get searchControl(): AbstractControl {
    return this.searchForm.get('search')!;
  }

  // Search results using rxResource
  searchResults = rxResource({
    stream: () =>
      this.searchControl.valueChanges.pipe(
        filter((q): q is string => !!q && q.length >= 2),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => {
          const filter = this.searchFilter();

          if (filter === 'movies') {
            return this.moviesApi.getMovies().pipe(
              map((movies) => ({
                movies: movies
                  .filter(
                    (m) =>
                      m.title.toLowerCase().includes(q.toLowerCase()) ||
                      m.genre.some((g) => g.toLowerCase().includes(q.toLowerCase())),
                  )
                  .slice(0, 5),
                cinemas: [],
              })),
              catchError(() => of({ movies: [], cinemas: [] })),
            );
          } else if (filter === 'cinemas') {
            return this.cinemaService.searchCinemas(q).pipe(
              map((cinemas) => ({ movies: [], cinemas: cinemas.slice(0, 5) })),
              catchError(() => of({ movies: [], cinemas: [] })),
            );
          } else {
            // Search both
            return combineLatest([
              this.moviesApi.getMovies().pipe(
                map((movies) =>
                  movies
                    .filter(
                      (m) =>
                        m.title.toLowerCase().includes(q.toLowerCase()) ||
                        m.genre.some((g) => g.toLowerCase().includes(q.toLowerCase())),
                    )
                    .slice(0, 3),
                ),
                catchError(() => of([])),
              ),
              this.cinemaService.searchCinemas(q).pipe(
                map((cinemas) => cinemas.slice(0, 3)),
                catchError(() => of([])),
              ),
            ]).pipe(map(([movies, cinemas]) => ({ movies, cinemas })));
          }
        }),
      ),
    defaultValue: { movies: [], cinemas: [] },
  });

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.menuOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.menuOpen = false;
    }

    if (this.searchDropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.searchDropdownOpen = false;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.toastrService.warning('Good bye!');
  }

  navigateToHome() {
    this.router.navigate(['/home']);
  }

  isAuth() {
    return this.authService.isAuthenticated();
  }

  user = this.userApi.user;

  setSearchFilter(filter: 'all' | 'movies' | 'cinemas') {
    this.searchFilter.set(filter);
    const currentValue = this.searchControl.value;
    if (currentValue && currentValue.length >= 2) {
      this.searchControl.setValue('', { emitEvent: false });
      setTimeout(() => this.searchControl.setValue(currentValue), 0);
    }
  }

  onSearchInput() {
    const value = this.searchControl.value;
    this.searchDropdownOpen = value && value.length >= 2;
  }

  closeDropdown() {
    this.searchDropdownOpen = false;
  }

  navigateToMovie(movieId: number) {
    this.closeDropdown();
    this.searchForm.reset();
    this.router.navigate(['/movies', movieId]);
  }

  navigateToCinema(cinemaId: number) {
    this.closeDropdown();
    this.searchForm.reset();
    this.router.navigate(['/cinemas', cinemaId]);
  }

  clearSearch() {
    this.searchForm.reset();
    this.closeDropdown();
  }
}
