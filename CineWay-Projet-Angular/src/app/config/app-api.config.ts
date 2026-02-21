import { environment } from '../../environments/environment';

export const APP_API = {
  auth: {
    login: `${environment.apiUrl}/auth/login`,
    signup: `${environment.apiUrl}/auth/register`,
    logout: `${environment.apiUrl}/auth/logout`,
    checkmail: `${environment.apiUrl}/auth/check-email`,
    me: `${environment.apiUrl}/auth/me`,
    changePassword: `${environment.apiUrl}/auth/change-password`,
  },
  movies: {
    movies: `${environment.apiUrl}/movies`,
    trending: `${environment.apiUrl}/movies/trending`,
    reviews: (movieId: number) => `${environment.apiUrl}/movies/${movieId}/reviews`,
    reviewSummary: (movieId: number) => `${environment.apiUrl}/movies/${movieId}/reviews/summary`,
    showtimes: (movieId: number) => `${environment.apiUrl}/movies/${movieId}/showtimes`,
  },

  faqs: {
    list: `${environment.apiUrl}/faqs`,
    create: `${environment.apiUrl}/faqs`,
    delete: (faqId: number) => `${environment.apiUrl}/faqs/${faqId}`,
  },

  reviews: {
    reviewById: (reviewId: number) => `${environment.apiUrl}/movies/reviews/${reviewId}`,
    reaction: (reviewId: number) => `${environment.apiUrl}/movies/reviews/${reviewId}/react`,
  },

  user: {
    me: `${environment.apiUrl}/users/me`,
    preferences: `${environment.apiUrl}/users/me/preferences`,
    profilePicture: `${environment.apiUrl}/users/me/profile-picture`,
    admin: `${environment.apiUrl}/users/admin/users`,
  },

  cinema: {
    list: `${environment.apiUrl}/cinemas/`,
    search: `${environment.apiUrl}/cinemas/search`,
    favorites: `${environment.apiUrl}/cinemas/favorites`,
    movies: (cinemaId: number) => `${environment.apiUrl}/cinemas/${cinemaId}/movies`,
    movieShowtimes: (cinemaId: number, movieId: number) =>
      `${environment.apiUrl}/cinemas/${cinemaId}/movies/${movieId}/showtimes`,
  },

  screenings: `${environment.apiUrl}/screenings`,
  showtimes: `${environment.apiUrl}/showtimes`,
  rooms: {
    list: `${environment.apiUrl}/rooms`,
  },
  admin: {
    stats: {
      movies: `${environment.apiUrl}/admin/stats/movies`,
      cinemas: `${environment.apiUrl}/admin/stats/cinemas`,
      users: `${environment.apiUrl}/admin/stats/users`,
      recentBookings: `${environment.apiUrl}/admin/stats/bookings/recent`,
      totalTickets: `${environment.apiUrl}/admin/stats/tickets/total`,
      revenue: `${environment.apiUrl}/admin/stats/revenue`,
      today: `${environment.apiUrl}/admin/stats/today`,
    },
  },
};
