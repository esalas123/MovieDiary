import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Movie {
  id: string;
  title: string;
  year: string;
  genres: string[];
  watched: boolean;
  dateAdded: string;
  dateWatched?: string;
  isFavorite?: boolean;
  rating?: number;
  review?: string;
  hideFromRecent?: boolean;
}

interface MoviesContextType {
  movies: Movie[];
  updateMovie: (movie: Movie) => Promise<void>;
  addMovie: (movie: Movie) => Promise<void>;
  deleteMovie: (id: string) => Promise<void>;
}

const MOVIE_STORAGE_KEY = 'movies';

// 1️⃣ Create Context
const MoviesContext = createContext<MoviesContextType | null>(null);

// 2️⃣ Provide Context
export const MoviesProvider = ({ children }: { children: ReactNode }) => {
  const [movies, setMovies] = useState<Movie[]>([]);

  // Load movies from AsyncStorage when app starts
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(MOVIE_STORAGE_KEY);
        setMovies(jsonValue ? JSON.parse(jsonValue) : []);
      } catch (error) {
        console.error('❌ Failed to load movies:', error);
      }
    };
    fetchMovies();
  }, []);

  // 3️⃣ Update movie in state & AsyncStorage
  const updateMovie = async (updatedMovie: Movie) => {
    try {
      const updatedMovies = movies.map(movie =>
        movie.id === updatedMovie.id ? updatedMovie : movie
      );

      setMovies(updatedMovies);
      await AsyncStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(updatedMovies));
    } catch (error) {
      console.error('❌ Failed to update movie:', error);
    }
  };

  const addMovie = async (newMovie: Movie) => {
    try {
      const updatedMovies = [...movies, newMovie];
      setMovies(updatedMovies);
      await AsyncStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(updatedMovies));
    } catch (error) {
      console.error('❌ Failed to add movie:', error);
    }
  };

  const deleteMovie = async (id: string) => {
    try {
      const updatedMovies = movies.filter(movie => movie.id !== id);
      setMovies(updatedMovies);
      await AsyncStorage.setItem(MOVIE_STORAGE_KEY, JSON.stringify(updatedMovies));
    } catch (error) {
      console.error('❌ Failed to delete movie:', error);
    }
  };

  return (
    <MoviesContext.Provider value={{ movies, updateMovie, addMovie, deleteMovie }}>
      {children}
    </MoviesContext.Provider>
  );
};

// 4️⃣ Custom hook to use the context
export const useMovies = () => {
  const context = useContext(MoviesContext);
  if (!context) {
    throw new Error('useMovies must be used within a MoviesProvider');
  }
  return context;
};
