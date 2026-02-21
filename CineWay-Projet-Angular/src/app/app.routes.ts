import { Routes } from '@angular/router';
import { Signup } from './auth/signup/signup';
import { Login } from './auth/login/login';
import { Explore } from './components/explore/explore';
import { LandingPageComponent } from './components/landingPage/landing-page-component/landing-page-component';
import { MainLayout } from './components/layouts/main-layout/main-layout';
import { Cinemas } from './components/cinemas/cinemas/cinemas';
import { CinemaDetails } from './components/cinemas/cinema-details/cinema-details';
import { Profile } from './components/profile/profile';
import { AdminLayoutComponent } from './components/admin/layouts/admin-layout/admin-layout';
import { AdminOverviewComponent } from './components/admin/pages/admin-overview/admin-overview';
import { AdminMoviesComponent } from './components/admin/pages/admin-movies/admin-movies';
import { AddEditMoviePageComponent } from './components/admin/pages/add-edit-movie-page/add-edit-movie-page';
import { AddEditCinemaPageComponent } from './components/admin/pages/add-edit-cinema-page/add-edit-cinema-page';
import { AddEditUserPageComponent } from './components/admin/pages/add-edit-user-page/add-edit-user-page';
import { AddEditShowtimePageComponent } from './components/admin/pages/add-edit-showtime-page/add-edit-showtime-page';
import { AdminCinemasComponent } from './components/admin/pages/admin-cinemas/admin-cinemas';
import { AdminUsersComponent } from './components/admin/pages/admin-users/admin-users';
import { AdminShowtimesComponent } from './components/admin/pages/admin-showtimes/admin-showtimes';
import { authGuard } from './auth/guards/auth.guard';
import { guestGuard } from './auth/guards/guest.guard';
import { adminGuard } from './auth/guards/admin/admin.guard';
import { NotFound } from './components/not-found/not-found';
import { SeatSelection } from './components/seat-selection/seat-selection';
import { Payment } from './components/payment/payment';
import { PaymentConfirmation } from './components/payment/confirmation/confirmation';
import { PaymentHistory } from './components/payment/history/history';
import { FavoritesComponent } from './components/favorites/favorites';
import { ComingSoonComponent } from './components/coming-soon/coming-soon';
import { TrendingComponent } from './components/trending/trending';
import { ShowingNowComponent } from './components/showing-now/showing-now';
import { Faq } from './components/faq/faq';
import { About } from './components/about/about';
import { SpecialOffers } from './components/special-offers/special-offers';
import { AdminFaqsComponent } from './components/admin/pages/admin-faqs/admin-faqs';
import { AddEditFaqPageComponent } from './components/admin/pages/add-edit-faq-page/add-edit-faq-page';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: LandingPageComponent },
      { path: 'explore', component: Explore },
      { path: 'cinemas', component: Cinemas },
      { path: 'cinemas/:id', component: CinemaDetails },
      { path: 'profile', component: Profile },
      { path: 'favorites', component: FavoritesComponent },
      { path: 'coming-soon', component: ComingSoonComponent },
      { path: 'trending', component: TrendingComponent },
      { path: 'showing-now', component: ShowingNowComponent },
      { path: 'faq', component: Faq },
      { path: 'about', component: About },
      { path: 'special-offers', component: SpecialOffers },
      { path: 'not-found', component: NotFound },
      {
        path: 'movies/:id',
        loadComponent: () =>
          import('./components/movies/movie-details/movie-details').then((m) => m.MovieDetails),
      },
      {
        path: 'movies/:id/showtimes',
        loadComponent: () =>
          import('./components/movies/movie-showtimes/movie-showtimes').then(
            (m) => m.MovieShowtimesComponent,
          ),
      },
      {
        path: 'screenings/:id',
        loadComponent: () =>
          import('./components/movies/showtime-selection/showtime-selection').then(
            (m) => m.ShowtimeSelectionComponent,
          ),
      },
      { path: 'seats/:id', component: SeatSelection },
      { path: 'payment', component: Payment },
      { path: 'payment/confirmation/:paymentId', component: PaymentConfirmation },
      { path: 'payment/history', component: PaymentHistory },
    ],
  },
  {
    path: '',
    canActivate: [guestGuard],
    children: [
      { path: '', component: LandingPageComponent },
      { path: 'auth/login', component: Login },
      { path: 'auth/signup', component: Signup },
      {
        path: 'home',
        component: Explore,
        canActivate: [authGuard],
      },
      {
        path: '',
        component: LandingPageComponent,
        canActivate: [guestGuard],
      },
      {
        path: 'cinemas',
        component: Cinemas,
        canActivate: [authGuard],
      },
      {
        path: 'cinemas/:id',
        component: CinemaDetails,
        canActivate: [authGuard],
      },
      {
        path: 'profile',
        component: Profile,
        canActivate: [authGuard],
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: AdminOverviewComponent },
      { path: 'movies', component: AdminMoviesComponent },
      { path: 'movies/add', component: AddEditMoviePageComponent },
      { path: 'movies/edit/:id', component: AddEditMoviePageComponent },
      { path: 'cinemas', component: AdminCinemasComponent },
      { path: 'cinemas/add', component: AddEditCinemaPageComponent },
      { path: 'cinemas/edit/:id', component: AddEditCinemaPageComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'users/add', component: AddEditUserPageComponent },
      { path: 'users/edit/:id', component: AddEditUserPageComponent },
      { path: 'showtimes', component: AdminShowtimesComponent },
      { path: 'showtimes/add', component: AddEditShowtimePageComponent },
      { path: 'showtimes/edit/:id', component: AddEditShowtimePageComponent },
      { path: 'faqs', component: AdminFaqsComponent },
      { path: 'faqs/add', component: AddEditFaqPageComponent },
      { path: 'faqs/edit/:id', component: AddEditFaqPageComponent },
    ],
  },
  {
    path: '**',
    redirectTo: '/not-found',
  },
];
