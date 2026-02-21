import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { StatsCard } from '../../components/stats-card/stats-card';
import { QuickNavCard } from '../../components/quick-nav-card/quick-nav-card';
import { AdminStatsService, RecentBooking } from '../../../../services/admin-stats.service';

@Component({
  selector: 'app-admin-overview',
  imports: [CommonModule, StatsCard, QuickNavCard],
  templateUrl: './admin-overview.html',
  styleUrls: ['./admin-overview.css'],
})
export class AdminOverviewComponent implements OnInit {
  private adminStats = inject(AdminStatsService);

  totalMovies = 0;
  totalCinemas = 0;
  recentBookings = 0;
  recentBookingsList: RecentBooking[] = [];
  totalUsers = 0;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      movies: this.adminStats.getMoviesCount(),
      cinemas: this.adminStats.getCinemasCount(),
      users: this.adminStats.getUsersCount(),
      recentBookings: this.adminStats.getRecentBookings(7, 10),
    })
      .pipe(
        catchError(() => {
          this.error = 'Unable to load dashboard statistics.';
          return of({ movies: 0, cinemas: 0, users: 0, recentBookings: [] as RecentBooking[] });
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(({ movies, cinemas, users, recentBookings }) => {
        this.totalMovies = movies;
        this.totalCinemas = cinemas;
        this.totalUsers = users;
        this.recentBookingsList = recentBookings;
        this.recentBookings = recentBookings.length;
      });
  }
}
