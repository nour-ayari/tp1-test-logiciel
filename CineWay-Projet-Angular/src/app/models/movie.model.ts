export interface CastMember {
  name: string;
  image_url: string | null;
}

export interface MovieModel {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  genre: string[];
  rating: string;
  imdb_rating: string;
  cast: CastMember[];
  director: string;
  writers: string[];
  producers: string[];
  release_date: string;
  country: string;
  language: string;
  budget: number;
  revenue: number;
  production_company: string;
  distributor: string;
  image_url: string;
  trailer_url: string;
  awards: string[];
  details: Record<string, any>;
  state: 'COMING_SOON' | 'SHOWING' | 'ENDED';
  created_at: string;
  updated_at: string;
}
