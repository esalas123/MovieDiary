import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  background: string;
  text: string;
  textSecondary: string;
  success: string;
  error: string;
  gradient: string[];
  card: string;
  border: string;
}

const lightTheme: Theme = {
  primary: '#6C63FF', // Main purple
  secondary: '#FF63B8', // Pink
  accent: '#63B3FF', // Blue
  surface: '#FFFFFF',
  background: '#F8F9FF',
  text: '#2D3748',
  textSecondary: 'rgba(45, 55, 72, 0.7)',
  success: '#4FD1C5',
  error: '#FC8181',
  gradient: ['#6C63FF', '#FF63B8', '#63B3FF'],
  card: 'rgba(255, 255, 255, 0.9)',
  border: 'rgba(108, 99, 255, 0.2)'
};

const darkTheme: Theme = {
  primary: '#8B80FF', // Lighter purple
  secondary: '#FF80C9', // Lighter pink
  accent: '#80C9FF', // Lighter blue
  surface: '#1A202C',
  background: '#171923',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  success: '#4FD1C5',
  error: '#FC8181',
  gradient: ['#8B80FF', '#FF80C9', '#80C9FF'],
  card: 'rgba(26, 32, 44, 0.9)',
  border: 'rgba(139, 128, 255, 0.2)'
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 