import { MovieModel } from './movie.model';

export interface ShowtimeItem {
  id: number;
  movie_id: number;
  room_id: number;
  screening_time: string;
  price: number;
  created_at: string;
}

export interface ShowtimeResponse {
  movie: MovieModel;
  showtimes: ShowtimeItem[];
}

export interface ShowtimeDetail {
  id: number;
  movie_id: number;
  room_name: string;
  screening_time: string;
  screening_date: string;
  price: number;
  available_seats_count: number;
  created_at: string;
  showtimes: ShowtimeItem[];
}

export interface ShowtimeDetail {
  id: number;
  movie_id: number;
  room_name: string;
  screening_time: string;
  screening_date: string;
  price: number;
  available_seats_count: number;
  created_at: string;
}

export interface showtimeBook {
  movie_id: number;
  room_id: number;
  screening_time: string;
  price: number;
  id: number;
  created_at: string;
}
