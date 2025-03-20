import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Modal, TouchableOpacity, FlatList, StyleSheet, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from '@react-native-community/slider';
import { useTheme } from './theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { getMoviesByType } from './storage/storage';
import { useMovies } from './context/MoviesContext';


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

export default function WatchlistScreen() {
  const { movies, updateMovie, addMovie, deleteMovie } = useMovies();
  const [tab, setTab] = useState<"Pending" | "Watched">("Pending");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { theme } = useTheme();
  
  // Form states
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Add this state near the top
  const [sortOption, setSortOption] = useState<'alphabetical' | 'year' | 'dateAdded'>('dateAdded');

  // Add these new state variables at the top of your component
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRating, setCurrentRating] = useState(5.0);
  const [currentReview, setCurrentReview] = useState("");
  const [ratingInput, setRatingInput] = useState("");

  const GENRES = ["Romance", "Action", "Comedy", "Horror", "Drama", "Sci-Fi", "Thriller", "Fantasy", "Mystery", "Musical"];

  const resetForm = () => {
    setTitle("");
    setYear("");
    setSelectedGenres([]);
    setSelectedMovie(null);
  };

  const handleAddMovie = () => {
    if (!title || !year || selectedGenres.length === 0) return;
    
    const newMovie = {
      id: Date.now().toString(),
      title,
      year,
      genres: selectedGenres,
      watched: false,
      dateAdded: new Date().toISOString(),
      isFavorite: false
    };

    addMovie(newMovie);
    resetForm();
    setShowAddForm(false);
  };

  const handleEditMovie = () => {
    if (!selectedMovie || !title || !year || selectedGenres.length === 0) return;

    updateMovie({
      ...selectedMovie,
      title,
      year,
      genres: selectedGenres,
      watched: selectedMovie.watched
    });

    resetForm();
    setShowEditForm(false);
  };

  const toggleWatched = (id: string) => {
    const movie = movies.find(m => m.id === id);
    if (movie) {
      updateMovie({ ...movie, watched: !movie.watched });
    }
  };

  const toggleFavorite = (id: string) => {
    const movie = movies.find(m => m.id === id);
    if (movie) {
      updateMovie({ ...movie, isFavorite: !movie.isFavorite });
    }
  };

  const openEditModal = (movie: Movie) => {
    setSelectedMovie(movie);
    setTitle(movie.title);
    setYear(movie.year);
    setSelectedGenres(movie.genres);
    setShowEditForm(true);
  };

  const renderGenreSelector = () => (
    <View style={styles.genreContainer}>
      {GENRES.map(genre => (
        <TouchableOpacity
          key={genre}
          style={[
            styles.genreChip,
            selectedGenres.includes(genre) && styles.genreChipSelected
          ]}
          onPress={() => {
            setSelectedGenres(prev =>
              prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
            );
          }}
        >
          <Text style={[
            styles.genreText,
            selectedGenres.includes(genre) && styles.genreTextSelected
          ]}>
            {genre}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity 
      style={[styles.movieCard, { backgroundColor: theme.surface }]}
      onPress={() => openEditModal(item)}
    >
      <View>
        <Text style={[styles.movieTitle, { color: theme.text }]}>{item.title} ({item.year})</Text>
        <View style={styles.genreRow}>
          {item.genres.map(genre => (
            <Text key={genre} style={[styles.movieGenre, { 
              backgroundColor: theme.background,
              color: theme.text 
            }]}>{genre}</Text>
          ))}
        </View>
      </View>
      <View style={styles.movieActions}>
        {tab === "Pending" ? (
          <TouchableOpacity
            style={[styles.watchedButton, { backgroundColor: theme.primary }]}
            onPress={() => toggleWatched(item.id)}
          >
            <Text style={styles.watchedButtonText}>Mark Watched</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(item.id)}
            >
              <Text style={[
                styles.favoriteIcon,
                { color: theme.text },
                item.isFavorite && { color: '#ff0000' }
              ]}>
                {item.isFavorite ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ratingButton}
              onPress={() => {
                setSelectedMovie(item);
                setCurrentRating(item.rating || 5.0);
                setRatingInput(item.rating?.toString() || "5.0");
                setCurrentReview(item.review || "");
                setShowRatingModal(true);
              }}
            >
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {item.rating?.toFixed(1) || '-'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  // Add this sorting function before filteredMovies
  const sortMovies = (moviesToSort: Movie[]) => {
    switch (sortOption) {
      case 'alphabetical':
        return [...moviesToSort].sort((a, b) => a.title.localeCompare(b.title));
      case 'year':
        return [...moviesToSort].sort((a, b) => parseInt(b.year) - parseInt(a.year));
      case 'dateAdded':
        return [...moviesToSort].sort((a, b) => 
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
    }
  };

  // Modify filteredMovies to include sorting
  const filteredMovies = sortMovies(
    movies.filter(movie => tab === "Pending" ? !movie.watched : movie.watched)
  );

  // Add handleDeleteMovie function
  const handleDeleteMovie = () => {
    if (!selectedMovie) return;
    deleteMovie(selectedMovie.id);
    resetForm();
    setShowEditForm(false);
  };

  // Add this function to handle rating updates
  const handleUpdateRating = (id: string) => {
    const rating = parseFloat(ratingInput);
    if (isNaN(rating) || rating < 0 || rating > 10) {
      return; // Don't update if rating is invalid
    }
    
    const movie = movies.find(m => m.id === id);
    if (movie) {
      updateMovie({ ...movie, rating, review: currentReview });
    }
    setShowRatingModal(false);
    setRatingInput(""); // Reset the input
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity 
          style={[styles.tab, tab === "Pending" && { borderBottomColor: theme.primary }]}
          onPress={() => setTab("Pending")}
        >
          <Text style={[styles.tabText, { color: theme.text }, tab === "Pending" && { color: theme.primary }]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === "Watched" && { borderBottomColor: theme.primary }]}
          onPress={() => setTab("Watched")}
        >
          <Text style={[styles.tabText, { color: theme.text }, tab === "Watched" && { color: theme.primary }]}>
            Watched
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Movie Button */}
      {tab === "Pending" && (
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={[styles.addButtonText, { color: 'white' }]}>+ Add Movie</Text>
        </TouchableOpacity>
      )}

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={[styles.sortLabel, { color: theme.text }]}>Sort by:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[
              styles.sortButton, 
              { borderColor: theme.primary },
              sortOption === 'alphabetical' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSortOption('alphabetical')}
          >
            <Text style={[
              styles.sortButtonText,
              { color: theme.primary },
              sortOption === 'alphabetical' && { color: 'white' }
            ]}>A-Z</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.sortButton, 
              { borderColor: theme.primary },
              sortOption === 'year' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSortOption('year')}
          >
            <Text style={[
              styles.sortButtonText,
              { color: theme.primary },
              sortOption === 'year' && { color: 'white' }
            ]}>Year</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.sortButton, 
              { borderColor: theme.primary },
              sortOption === 'dateAdded' && { backgroundColor: theme.primary }
            ]}
            onPress={() => setSortOption('dateAdded')}
          >
            <Text style={[
              styles.sortButtonText,
              { color: theme.primary },
              sortOption === 'dateAdded' && { color: 'white' }
            ]}>Recent</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Movie List */}
      <FlatList
        data={filteredMovies}
        renderItem={renderMovie}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add Movie Modal */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Movie</Text>
      <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background,
                borderColor: theme.primary,
                color: theme.text
              }]}
        placeholder="Title"
              placeholderTextColor={theme.text}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background,
                borderColor: theme.primary,
                color: theme.text
              }]}
        placeholder="Year"
              placeholderTextColor={theme.text}
        value={year}
        onChangeText={setYear}
        keyboardType="numeric"
            />
            {renderGenreSelector()}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAddMovie}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Add Movie</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Movie Modal */}
      <Modal
        visible={showEditForm}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Movie</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background,
                borderColor: theme.primary,
                color: theme.text
              }]}
              placeholder="Title"
              placeholderTextColor={theme.text}
              value={title}
              onChangeText={setTitle}
      />
      <TextInput
              style={[styles.input, { 
                backgroundColor: theme.background,
                borderColor: theme.primary,
                color: theme.text
              }]}
              placeholder="Year"
              placeholderTextColor={theme.text}
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
            />
            {renderGenreSelector()}
            <View style={styles.watchedToggle}>
              <Text style={[styles.watchedLabel, { color: theme.text }]}>Mark as Watched</Text>
              <Switch
                value={selectedMovie?.watched}
                onValueChange={(value) => {
                  if (selectedMovie) {
                    updateMovie({ ...selectedMovie, watched: value });
                  }
                }}
                trackColor={{ false: '#ddd', true: '#6366f1' }}
                thumbColor={'white'}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteMovie}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Delete</Text>
              </TouchableOpacity>
              <View style={styles.rightButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    resetForm();
                    setShowEditForm(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleEditMovie}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>Save Changes</Text>
        </TouchableOpacity>
      </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Rate Movie</Text>
            <View style={styles.ratingContainer}>
              <TextInput
                style={[styles.ratingInput, { 
                  backgroundColor: theme.background,
                  borderColor: theme.primary,
                  color: theme.text
                }]}
                value={ratingInput}
                onChangeText={(value) => {
                  setRatingInput(value);
                  const rating = parseFloat(value);
                  if (!isNaN(rating) && rating >= 0 && rating <= 10) {
                    setCurrentRating(rating);
                  }
                }}
                keyboardType="decimal-pad"
                placeholder="Rating"
                maxLength={4}
              />
              <Text style={[styles.ratingHint, { color: theme.text }]}>Rating must be between 0 and 10</Text>
            </View>
            <TextInput
              style={[styles.reviewInput, { 
                backgroundColor: theme.background,
                borderColor: theme.primary,
                color: theme.text
              }]}
              placeholder="Add a review here..."
              value={currentReview}
              onChangeText={setCurrentReview}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRatingModal(false);
                  setCurrentRating(5.0);
                  setCurrentReview("");
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={() => handleUpdateRating(selectedMovie!.id)}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Save Rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    padding: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#6366f1',
  },
  addButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  movieCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  movieGenre: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  watchedButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  watchedButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  genreChip: {
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  genreChipSelected: {
    backgroundColor: '#6366f1',
  },
  genreText: {
    color: '#6366f1',
    fontSize: 14,
  },
  genreTextSelected: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  submitButton: {
    backgroundColor: '#6366f1',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  watchedToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  watchedLabel: {
    fontSize: 16,
    color: '#333',
  },
  sortContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6366f1',
    backgroundColor: 'transparent',
  },
  sortButtonActive: {
    backgroundColor: '#6366f1',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  rightButtons: {
    flexDirection: 'row',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  movieActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 3,
  },
  favoriteIcon: {
    fontSize: 30,
    color: '#666',
  },
  favoriteIconActive: {
    color: '#ef4444',
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    padding: 8,
  },
  starIcon: {
    fontSize: 22,
    color: '#fbbf24',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fbbf24',
    textAlign: 'center',
    width: 100,
    marginBottom: 16,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    height: 100,
    fontSize: 16,
  },
  ratingHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
