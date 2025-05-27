export interface Movie {
  id: string;
  title: string;
  year: string;
  genres: string[];
  watched: boolean;
  dateAdded: string;
  dateWatched?: string;
  isFavorite?: boolean;
  rating?: number;
  notes?: string;
  rewatch?: boolean;
  review?: string;
} 