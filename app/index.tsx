//Home

import React, { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from './theme/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useMovies } from './context/MoviesContext';
import Icon from 'react-native-vector-icons/Ionicons';

interface Movie {
  id: string;
  title: string;
  year: string;
  genres: string[];
  watched: boolean;
  dateAdded: string;
  isFavorite?: boolean;
  hideFromRecent?: boolean;
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
        onPress={() => isRecentAddition && setPressedId(pressedId === item.id ? null : item.id)}
      >
        <View style={[styles.movieItemAccent, { backgroundColor: accentColors.recent }]} />
        <View style={[styles.movieItem, { backgroundColor: theme.surface }]}>
          <View style={styles.movieContent}>
            <Text style={[styles.movieItemText, { color: theme.text }]}>{item.title}</Text>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search movies..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchBar, { 
            backgroundColor: theme.surface,
            color: theme.text 
          }]}
          placeholderTextColor={theme.text}
        />
        <TouchableOpacity 
          style={[styles.searchIcon, { backgroundColor: accentColors.continue }]}
          onPress={() => setSearchQuery("")}
        >
          <Icon 
            name={searchQuery ? "close" : "search"}
            size={18} 
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
      >
        {/* Show summary and goal sections only when not searching */}
        {!searchQuery && (
          <>
            {/* Watchlist Summary */}
            <View style={[styles.summaryContainer, { backgroundColor: theme.surface }]}>
              {Object.entries(watchlistSummary).map(([key, value]) => (
                <View key={key} style={styles.summaryItem}>
                  <View style={[styles.summaryCircle, { backgroundColor: accentColors.summary[key as keyof typeof watchlistSummary] }]}>
                    <Text style={styles.summaryNumber}>{value}</Text>
                  </View>
                  <Text style={[styles.summaryLabel, { color: theme.text }]}>{key}</Text>
                </View>
              ))}
            </View>

            {/* Monthly Goal Progress */}
            <View style={[styles.progressContainer, { backgroundColor: theme.surface }]}>
              <View style={styles.progressHeader}>
                <View style={styles.goalTitleContainer}>
                  <Text style={[styles.progressTitle, { color: theme.text }]}>Monthly Goal</Text>
                  <TouchableOpacity 
                    onPress={() => setIsGoalModalVisible(true)}
                    style={styles.editGoalButton}
                  >
                    <Text style={[styles.editGoalText, { color: theme.primary }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.progressSubtitle, { color: theme.text }]}>
                  {monthlyGoal.current}/{monthlyGoal.target} movies watched
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: accentColors.progress,
                        width: `${monthlyGoal.percentage}%`
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressPercentage, { color: theme.text }]}>
                  {monthlyGoal.percentage}%
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Show either search results or recent additions */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionAccent, { backgroundColor: accentColors.recent }]} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {searchQuery ? 'Search Results' : 'Recent Additions'}
          </Text>
        </View>
        {getFilteredMovies().map((item, index) => renderMovieItem(item, index))}
      </ScrollView>

      {/* Goal Edit Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isGoalModalVisible}
        onRequestClose={() => setIsGoalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Monthly Goal</Text>
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.primary
              }]}
              placeholder="Enter new target"
              placeholderTextColor={theme.text}
              keyboardType="numeric"
              value={newGoalTarget}
              onChangeText={setNewGoalTarget}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.surface }]}
                onPress={() => setIsGoalModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleUpdateGoal}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Save</Text>
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
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    padding: 15,
    paddingRight: 50,
    borderRadius: 15,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 3,
    fontSize: 16,
    borderWidth: 0,
    zIndex: 1,
  },
  searchIcon: {
    position: 'absolute',
    right: 0,
    height: 50,
    width: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  searchIconText: {
    color: 'white',
    fontSize: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 20,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 3,
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  summaryLabel: {
    fontSize: 14,
    marginTop: 8,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  progressContainer: {
    padding: 20,
    borderRadius: 20,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    elevation: 3,
    marginBottom: 20,
  },
  progressHeader: {
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 12,
  },
  sectionAccent: {
    width: 8,
    height: 30,
    borderRadius: 4,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
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
  movieItemText: {
    fontSize: 16,
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 15,
    boxShadow: '0px 2px 4px rgba(0,0,0,0.25)',
    elevation: 5,
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
  deleteButton: {
    padding: 8,
  },
  movieContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: 14,
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
});
