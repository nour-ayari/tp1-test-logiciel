import { MovieModel } from './movie.model';

export interface Cinema {
  id: number;
  name: string;
  address: string;
  city: string;
  amenities: string[];
  created_at: string;
  contact_number?: string;
  email?: string;
  gallery_image_url?: string;
  seating_layout?: string;
  movies?: MovieModel[];
}

export default interface CinemaResponse {
  cinemas: Cinema[];
  total: number;
}
