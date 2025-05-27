//Home

import React, { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Modal, Platform, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from './theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMovies } from './context/MoviesContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface Movie {
  id: string;
  title: string;
  year: string;
  genres: string[];
  watched: boolean;
  dateAdded: string;
  isFavorite?: boolean;
  hideFromRecent?: boolean;
  dateWatched?: string;
}

export default function HomeScreen() {
  const { movies } = useMovies();
  const [searchQuery, setSearchQuery] = useState("");
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState({
    current: 0,
    target: 10,
    percentage: 0
  });
  const [watchlistSummary, setWatchlistSummary] = useState({ 
    Watched: 0, 
    Pending: 0, 
    Favorites: 0 
  });
  const { theme } = useTheme();
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [selectedList, setSelectedList] = useState<'Watched' | 'Pending' | 'Favorites' | null>(null);
  
  // Function to update summary counts
  const updateSummary = (movieList: Movie[]) => {
    const summary = {
      Watched: movieList.filter(m => m.watched).length,
      Pending: movieList.filter(m => !m.watched).length,
      Favorites: movieList.filter(m => m.isFavorite).length
    };
    setWatchlistSummary(summary);
    
    // Update monthly goal progress
    const watchedThisMonth = movieList.filter(m => {
      const movieDate = new Date(m.dateAdded);
      const currentDate = new Date();
      return m.watched && 
        movieDate.getMonth() === currentDate.getMonth() &&
        movieDate.getFullYear() === currentDate.getFullYear();
    }).length;
    
    setMonthlyGoal(prev => ({
      ...prev,
      current: watchedThisMonth,
      percentage: Math.round((watchedThisMonth / prev.target) * 100)
    }));
  };

  // Replace useEffect with useFocusEffect to update when tab is focused
  useFocusEffect(
    useCallback(() => {
      const fetchMovies = async () => {
        const storedMovies = await loadMovies();
        updateSummary(storedMovies);
      };
      fetchMovies();
    }, [])
  );

  // Function to save movies
  const saveMovies = async (movies: Movie[]) => {
    try {
      await AsyncStorage.setItem("movies", JSON.stringify(movies));
      updateSummary(movies);
    } catch (error) {
      console.error("Failed to save movies", error);
    }
  };

  // Function to load movies
  const loadMovies = async () => {
    try {
      const data = await AsyncStorage.getItem("movies");
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load movies", error);
      return [];
    }
  };

  // Sample data (Replace with actual data from your state)
  const recentAdditions = ["The Shawshank Redemption", "Pulp Fiction", "Fight Club", "Forrest Gump", "The Matrix"];
  
  // Accent colors for different sections
  const accentColors = {
    recent: theme.primary,
    continue: theme.secondary,
    upNext: theme.accent,
    progress: theme.primary,
    summary: {
      Watched: theme.primary,
      Pending: theme.secondary,
      Favorites: theme.accent
    }
  };

  // Add this function to handle deletion
  const handleDeleteMovie = async (id: string) => {
    const updatedMovies = movies.map(movie => 
      movie.id === id 
        ? { ...movie, hideFromRecent: true }
        : movie
    );
    updateSummary(updatedMovies);
    await saveMovies(updatedMovies);
  };

  // Update the renderMovieItem function
  const renderMovieItem = (item: Movie, index: number) => {
    const isRecentAddition = !searchQuery.trim();
    return (
      <TouchableOpacity 
        key={index} 
        style={styles.movieItemContainer}
        onPress={() => {
          setSelectedMovie(item);
          setShowDetailsModal(true);
        }}
      >
        <View style={[styles.movieItemAccent, { backgroundColor: accentColors.recent }]} />
        <View style={[styles.movieItem, { backgroundColor: theme.surface }]}>
          <View style={styles.movieContent}>
            <View style={styles.movieDetails}>
              <Text style={[styles.movieItemText, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.dateAddedText, { color: theme.textSecondary }]}>
                Added: {new Date(item.dateAdded).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[
              styles.status, 
              { color: item.watched ? theme.success : theme.error }
            ]}>
              {item.watched ? 'Watched' : 'Pending'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleUpdateGoal = () => {
    const newTarget = parseInt(newGoalTarget);
    if (!isNaN(newTarget) && newTarget > 0) {
      setMonthlyGoal(prev => ({
        ...prev,
        target: newTarget,
        percentage: Math.round((prev.current / newTarget) * 100)
      }));
      setIsGoalModalVisible(false);
      setNewGoalTarget("");
    }
  };

  // Add this function to get recent additions
  const getRecentAdditions = () => {
    return movies
      .filter(movie => !movie.hideFromRecent)
      .sort((a, b) => 
        new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
      )
      .slice(0, 5);
  };

  // Add this function for filtering movies
  const getFilteredMovies = () => {
    if (!searchQuery.trim()) {
      return getRecentAdditions(); // Show recent additions when no search
    }
    return movies.filter(movie =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Add this function to get filtered movies based on selected list
  const getFilteredListMovies = () => {
    if (!selectedList) return [];
    switch (selectedList) {
      case 'Watched':
        return movies.filter(m => m.watched);
      case 'Pending':
        return movies.filter(m => !m.watched);
      case 'Favorites':
        return movies.filter(m => m.isFavorite);
      default:
        return [];
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Status Bar Space */}
      <View style={styles.statusBar} />

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/images/logo1.png')}
          style={styles.appIcon}
          resizeMode="contain"
        />
        <Text style={[styles.appTitle, { color: theme.text }]}>Movie Diary</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search movies..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { 
            backgroundColor: theme.card,
            color: theme.text,
            borderColor: theme.border
          }]}
          placeholderTextColor={theme.textSecondary}
        />
        <TouchableOpacity 
          style={[styles.searchBtn, { backgroundColor: theme.primary }]}
          onPress={() => setSearchQuery("")}
        >
          <Ionicons 
            name={searchQuery ? "close" : "search"}
            size={24} 
            color="white"
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        {!searchQuery ? (
          <>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              {Object.entries(watchlistSummary).map(([key, value]) => (
                <TouchableOpacity 
                  key={key}
                  style={[styles.statCard, { 
                    backgroundColor: theme.card,
                    borderColor: theme.border
                  }]}
                  onPress={() => {
                    setSelectedList(key as 'Watched' | 'Pending' | 'Favorites');
                    setShowListModal(true);
                  }}
                >
                  <Text style={[styles.statNumber, { color: theme[key === 'Watched' ? 'primary' : key === 'Pending' ? 'secondary' : 'accent'] }]}>
                    {value}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Monthly Goal */}
            <View style={[styles.goalSection, { 
              backgroundColor: theme.card,
              borderColor: theme.border
            }]}>
              <View style={styles.goalHeader}>
                <Text style={[styles.goalTitle, { color: theme.text }]}>Monthly Goal</Text>
                <TouchableOpacity 
                  style={[styles.editBtn, { backgroundColor: theme.primary }]}
                  onPress={() => setIsGoalModalVisible(true)}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.goalProgress, { color: theme.textSecondary }]}>
                {monthlyGoal.current}/{monthlyGoal.target} movies watched
              </Text>
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <LinearGradient
                  colors={[theme.gradient[0], theme.gradient[1], theme.gradient[2]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${monthlyGoal.percentage}%` }]}
                />
                <Text style={[styles.progressPercentage, { color: theme.text }]}>
                  {monthlyGoal.percentage}%
                </Text>
              </View>
            </View>
          </>
        ) : null}

        {/* Recent Movies or Search Results */}
        <View style={[styles.recentSection, searchQuery && styles.searchResultsSection]}>
          <View style={styles.sectionTitleContainer}>
            <LinearGradient
              colors={[theme.gradient[0], theme.gradient[1], theme.gradient[2]]}
              style={styles.sectionTitleBar}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {searchQuery ? 'Search Results' : 'Recent Additions'}
            </Text>
          </View>
          
          {getFilteredMovies().length > 0 ? (
            getFilteredMovies().map((item, index) => renderMovieItem(item, index))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <Text style={styles.emptyIcon}>🎭</Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchQuery ? 'No movies found' : 'No recent additions'}
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'Start adding movies to see them here'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      
      {/* Goal Edit Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isGoalModalVisible}
        onRequestClose={() => setIsGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.card,
            borderColor: theme.border
          }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Edit Monthly Goal
            </Text>
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border
              }]}
              placeholder="Enter new target"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={newGoalTarget}
              onChangeText={setNewGoalTarget}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.surface }]}
                onPress={() => setIsGoalModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleUpdateGoal}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Movie Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDetailsModal}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.card,
            borderColor: theme.border
          }]}>
            {selectedMovie && (
              <>
                <View style={styles.detailsHeader}>
                  <Text style={[styles.detailsTitle, { color: theme.text }]}>
                    {selectedMovie.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowDetailsModal(false)}
                  >
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsContent}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Year Released:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{selectedMovie.year}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Status:</Text>
                    <Text style={[
                      styles.detailValue, 
                      { color: selectedMovie.watched ? theme.success : theme.error }
                    ]}>
                      {selectedMovie.watched ? 'Watched' : 'Pending'}
                    </Text>
                  </View>

                  <View style={styles.genresSection}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Genres:</Text>
                    <View style={styles.genreChips}>
                      {selectedMovie.genres.map((genre, index) => (
                        <View 
                          key={index}
                          style={[styles.genreChip, { backgroundColor: theme.primary + '20' }]}
                        >
                          <Text style={[styles.genreChipText, { color: theme.primary }]}>
                            {genre}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Date Added:</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {new Date(selectedMovie.dateAdded).toLocaleDateString()}
                    </Text>
                  </View>

                  {selectedMovie.watched && selectedMovie.dateWatched && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Date Watched:</Text>
                      <Text style={[styles.detailValue, { color: theme.text }]}>
                        {new Date(selectedMovie.dateWatched).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Movie List Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showListModal}
        onRequestClose={() => {
          setShowListModal(false);
          setSelectedList(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { 
            backgroundColor: theme.card,
            borderColor: theme.border,
            maxHeight: '80%'
          }]}>
            <View style={styles.listModalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedList} Movies
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowListModal(false);
                  setSelectedList(null);
                }}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.listModalContent}>
              {getFilteredListMovies().map((movie) => (
                <TouchableOpacity
                  key={movie.id}
                  style={[styles.listMovieItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    setSelectedMovie(movie);
                    setShowListModal(false);
                    setShowDetailsModal(true);
                  }}
                >
                  <Text style={[styles.listMovieTitle, { color: theme.text }]}>
                    {movie.title} ({movie.year})
                  </Text>
                </TouchableOpacity>
              ))}
              {getFilteredListMovies().length === 0 && (
                <View style={styles.emptyListState}>
                  <Text style={[styles.emptyListText, { color: theme.textSecondary }]}>
                    No movies in this list
                  </Text>
                </View>
              )}
            </ScrollView>
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
  statusBar: {
    height: Platform.OS === 'ios' ? 44 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  appIcon: {
    width: 45,
    height: 45,
    marginRight: 15,
  },
  appIconText: {
    fontSize: 24,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  searchContainer: {
    margin: 20,
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    padding: 18,
    paddingRight: 50,
    borderRadius: 20,
    fontSize: 16,
    borderWidth: 2,
  },
  searchBtn: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalSection: {
    margin: 20,
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  editBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  goalProgress: {
    fontSize: 16,
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressPercentage: {
    position: 'absolute',
    right: 0,
    top: -25,
    fontSize: 14,
    fontWeight: '600',
  },
  recentSection: {
    margin: 20,
    marginBottom: 100,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleBar: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  floatingBtn: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  floatingBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBtnText: {
    color: 'white',
    fontSize: 32,
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  movieItemContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  movieItemAccent: {
    width: 6,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  movieItem: {
    flex: 1,
    padding: 16,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    boxShadow: '0px 1px 3px rgba(0,0,0,0.05)',
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movieContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movieDetails: {
    flex: 1,
  },
  movieItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateAddedText: {
    fontSize: 12,
    opacity: 0.8,
  },
  status: {
    fontSize: 14,
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editGoalButton: {
    marginLeft: 10,
    padding: 5,
  },
  editGoalText: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  detailsContent: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  genresSection: {
    gap: 8,
  },
  genreChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultsSection: {
    marginTop: 0,
  },
  listModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  listModalContent: {
    flex: 1,
  },
  listMovieItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  listMovieTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyListState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
  },
});
