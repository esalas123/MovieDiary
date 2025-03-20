import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  primary: '#2563EB',    // Royal Blue
  secondary: '#10B981',  // Emerald Green
  background: '#FFFFFF', // White
  surface: '#F3F4F6',   // Light Gray
  text: '#1F2937',      // Dark Gray
  accent: '#F59E0B',    // Amber
  error: '#EF4444',     // Red
  success: '#10B981',   // Emerald Green
};

export const darkTheme = {
  primary: '#3B82F6',    // Lighter Blue
  secondary: '#34D399',  // Mint Green
  background: '#111827', // Very Dark Blue-Gray
  surface: '#1F2937',   // Dark Gray
  text: '#F9FAFB',      // Off-White
  accent: '#FBBF24',    // Bright Amber
  error: '#F87171',     // Light Red
  success: '#34D399',   // Mint Green
};

type Theme = typeof lightTheme;
type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      setIsDark(savedTheme === 'true');
    } catch (error) {
      console.error('Failed to load theme preference', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newValue = !isDark;
      setIsDark(newValue);
      await AsyncStorage.setItem('isDarkMode', String(newValue));
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme: isDark ? darkTheme : lightTheme,
      isDark,
      toggleTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 