export type MovieStatus = 'Published' | 'Upcoming' | 'Draft' | 'Archived';

export type StatusChip = {
  label: string;
  classes: string;
};

export type MovieRow = {
  id: number;
  title: string;
  releaseDate: string;
  status: MovieStatus;
  genre: string;
  runtime: string;
};
