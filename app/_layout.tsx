import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { MoviesProvider } from './context/MoviesContext';
import { Tabs, router } from 'expo-router';
import { useColorScheme, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from 'react';
import SplashScreenComponent from '../components/SplashScreen';

function TabsNavigator() {
  const { theme, isDark } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        // Top header bar styling
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          color: theme.text,
          fontWeight: 'bold', // Making all header titles bold
        },
        
        // Bottom tab bar styling
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.background,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../assets/images/logo1.png')}
                style={{ width: 35, height: 35, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text style={{
                 color: theme.text,
                 fontSize: 20,
                 fontWeight: 'bold' // Changed from '600' to 'bold'
               }}>
                Movie Diary
              </Text>
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              style={[
                props.style,
                {
                  backgroundColor: props.accessibilityState?.selected ? theme.primary + '20' : 'transparent',
                }
              ]}
              onPress={(event) => {
                props.onPress?.(event);
                if (props.accessibilityState?.selected) {
                  const canGoBack = router.canGoBack();
                  if (canGoBack) {
                    router.back();
                  }
                }
              }}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: "Watchlist",
          tabBarIcon: ({ color }) => (
            <Ionicons name="list" size={20} color={color} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              style={[
                props.style,
                {
                  backgroundColor: props.accessibilityState?.selected ? theme.primary + '20' : 'transparent',
                }
              ]}
              onPress={props.onPress}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart" size={20} color={color} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              style={[
                props.style,
                {
                  backgroundColor: props.accessibilityState?.selected ? theme.primary + '20' : 'transparent',
                }
              ]}
              onPress={props.onPress}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={20} color={color} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              style={[
                props.style,
                {
                  backgroundColor: props.accessibilityState?.selected ? theme.primary + '20' : 'transparent',
                }
              ]}
              onPress={props.onPress}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}

export default function Layout() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate splash screen delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Changed from 2000 to 3000 ms

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreenComponent />;
  }
  
  return (
    <ThemeProvider>
      <MoviesProvider>
        <TabsNavigator />
      </MoviesProvider>
    </ThemeProvider>
  );
}