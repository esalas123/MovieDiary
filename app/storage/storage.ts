import AsyncStorage from '@react-native-async-storage/async-storage';

interface Movie {
  id: string;
  title: string;
  year: string;
  genres: string[];
  watched: boolean;
  dateAdded: string;
  isFavorite?: boolean;
  rating?: number;
  review?: string;
}

const MOVIE_STORAGE_KEY = 'movies';

// 🔹 Get all movies
export const getMovies = async (): Promise<Movie[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(MOVIE_STORAGE_KEY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('❌ Failed to get movies:', error);
    return [];
  }
};

// 🔹 Add or update a movie
export const addOrUpdateMovie = async (movie: Movie) => {
  try {
    const movies = await getMovies();
    const index = movies.findIndex((m: Movie) => m.id === movie.id);

    if (index !== -1) {
      movies[index] = movie;
    } else {
      movies.push(movie);
    }

    await AsyncStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(movies));
  } catch (error) {
    console.error('❌ Failed to add/update movie:', error);
  }
};

// 🔹 Get movies by type (watchlist or favorites)
export const getMoviesByType = async (type: 'isFavorite' | 'watched'): Promise<Movie[]> => {
  const movies = await getMovies();
  return movies.filter((movie: Movie) => movie[type]);
};

// 🔹 Toggle favorite status
export const toggleFavorite = async (id: string) => {
  try {
    const movies = await getMovies();
    const updatedMovies = movies.map((movie: Movie) =>
      movie.id === id ? { ...movie, isFavorite: !movie.isFavorite } : movie
    );
    await AsyncStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(updatedMovies));
  } catch (error) {
    console.error('❌ Failed to toggle favorite:', error);
  }
};

// 🔹 Toggle watchlist status
export const toggleWatchlist = async (id: string) => {
  try {
    const movies = await getMovies();
    const updatedMovies = movies.map((movie: Movie) =>
      movie.id === id ? { ...movie, watched: !movie.watched } : movie
    );
    await AsyncStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(updatedMovies));
  } catch (error) {
    console.error('❌ Failed to toggle watchlist:', error);
  }
};

// 🔹 Remove a movie
export const removeMovie = async (id: string) => {
  try {
    const movies = await getMovies();
    const updatedMovies = movies.filter(movie => movie.id !== id);
    await AsyncStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(updatedMovies));
  } catch (error) {
    console.error('❌ Failed to remove movie:', error);
  }
};

// 🔹 Clear all movies (for debugging)
export const clearMovies = async () => {
  try {
    await AsyncStorage.removeItem(MOVIE_STORAGE_KEY);
  } catch (error) {
    console.error('❌ Failed to clear movies:', error);
  }
};

// Default export object containing all storage functions
//export default {
//  getMovies,
//  addOrUpdateMovie,
//  getMoviesByType,
//  toggleFavorite,
//  toggleWatchlist,
//  removeMovie,
//  clearMovies
//};
