import { View, Text, FlatList, StyleSheet, TouchableOpacity, Share, Modal, TextInput } from "react-native";
import { useState } from "react";
import { useTheme } from './theme/ThemeContext';
import { useMovies } from './context/MoviesContext';
import { Movie } from './types/movie';

export default function FavoritesScreen() {
  const { movies, updateMovie } = useMovies();
  const [sortOption, setSortOption] = useState<"title" | "rating">("rating");
  const { theme } = useTheme();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [editedReview, setEditedReview] = useState("");
  const [editedRating, setEditedRating] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [currentRating, setCurrentRating] = useState(0);

  const favoriteMovies = movies
    .filter(movie => movie.isFavorite)
    .sort((a, b) => (
      sortOption === "rating" 
        ? (b.rating || 0) - (a.rating || 0)
        : a.title.localeCompare(b.title)
    ));

  const removeFavorite = (id: string) => {
    const movie = movies.find(m => m.id === id);
    if (movie) {
      updateMovie({ ...movie, isFavorite: false });
    }
  };

  const shareMovie = async (title: string) => {
    try {
      await Share.share({ message: `Check out "${title}" – one of my favorite movies! 🎬` });
    } catch (error) {
      console.error("Error sharing movie", error);
    }
  };

  const handleSaveReview = () => {
    if (!selectedMovie) return;
    
    const parsedRating = parseFloat(editedRating);
    
    // Validate rating
    if (editedRating && (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 10)) {
      setRatingError("Rating must be between 0 and 10");
      return;
    }
    
    updateMovie({
      ...selectedMovie,
      rating: parsedRating || selectedMovie.rating,
      review: editedReview
    });

    setShowReviewModal(false);
    setSelectedMovie(null);
    setRatingError(""); // Clear any errors
  };

  const handleRatingChange = (text: string) => {
    setEditedRating(text);
    setRatingError(""); // Clear error when user starts typing
    const rating = parseFloat(text);
    if (!isNaN(rating) && rating >= 0 && rating <= 10) {
      setCurrentRating(rating);
    }
  };

  const renderMovie = ({ item }: { item: Movie }) => (
    <TouchableOpacity 
      style={[styles.movieCard, { backgroundColor: theme.surface }]}
      onPress={() => {
        setSelectedMovie(item);
        setEditedReview(item.review || "");
        setEditedRating(item.rating?.toString() || "5.0");
        setShowReviewModal(true);
      }}
    >
      <View style={styles.movieHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.movieTitle, { color: theme.text }]}>
            <Text style={styles.boldTitle}>{item.title}</Text> ({item.year})
          </Text>
          <Text style={[styles.movieRating, { color: theme.text }]}>⭐ {item.rating?.toFixed(1) || "-"}</Text>
        </View>
      </View>
      
      <View style={styles.genreRow}>
        {item.genres.map((genre) => (
          <Text key={genre} style={[
            styles.movieGenre, 
            { 
              backgroundColor: theme.background,
              color: theme.text,
              borderWidth: 1,
              borderColor: theme.primary + '40'  // Adding a subtle border with 25% opacity
            }
          ]}>
            {genre}
          </Text>
        ))}
      </View>
      
      {item.notes ? <Text style={[styles.movieNotes, { color: theme.text }]}>📝 {item.notes}</Text> : null}
      
      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => removeFavorite(item.id)}>
          <Text style={{ color: "red" }}>Remove</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Sorting Toggle */}
      <View style={styles.sortingContainer}>
        <TouchableOpacity onPress={() => setSortOption(sortOption === "rating" ? "title" : "rating")}>
          <Text style={{ color: theme.text }}>
            Sort by: {sortOption === "rating" ? "⭐ Rating" : "📝 Title"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Favorites List */}
      <FlatList
        data={favoriteMovies}
        renderItem={renderMovie}
        keyExtractor={(item) => item.id}
        numColumns={1} // Changed from 2 to 1 for list view
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={showReviewModal}
        transparent={true}
        animationType="slide"
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedMovie?.title}
              </Text>
              <TouchableOpacity 
                onPress={() => setShowReviewModal(false)}
                style={[styles.iconButton, { backgroundColor: theme.error }]}
              >
                <Text style={styles.iconButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.ratingContainer}>
              <TextInput
                style={[styles.ratingInput, { 
                  backgroundColor: theme.background,
                  color: '#fbbf24',
                  borderColor: theme.primary + '40'
                }]}
                value={editedRating}
                onChangeText={handleRatingChange}
                placeholder="Rating"
                keyboardType="decimal-pad"
                placeholderTextColor={theme.text + '60'}
                maxLength={4}
              />
              <Text style={[styles.ratingHint, { 
                color: ratingError ? theme.error : theme.text + '80'
              }]}>
                {ratingError || "Rating must be between 0 and 10"}
              </Text>
            </View>
            
            <TextInput
              style={[styles.reviewInput, { 
                backgroundColor: theme.background,
                borderColor: theme.primary + '40',
                color: theme.text
              }]}
              value={editedReview}
              onChangeText={setEditedReview}
              placeholder="Write your review..."
              multiline
              placeholderTextColor={theme.text + '60'}
            />
            
            <TouchableOpacity 
              style={[styles.iconButton, styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveReview}
            >
              <Text style={styles.iconButtonText}>✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sortingContainer: {
    padding: 10,
    alignItems: "center",
  },
  listContainer: {
    padding: 8,
  },
  movieCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    width: "100%", // Take full width for list mode
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  movieHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: "400",
    flex: 1,
  },
  boldTitle: {
    fontWeight: "700", // Bold weight for just the title
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 4,
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
  movieRating: {
    fontSize: 16,
    fontWeight: "bold",
  },
  movieNotes: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,  // Makes it more box-like instead of circular
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 100,
    marginBottom: 16,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    height: 100,
    fontSize: 16,
  },
  ratingHint: {
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});