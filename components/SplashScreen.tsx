import { useEffect } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useRouter, useNavigationContainerRef } from "expo-router";

SplashScreen.preventAutoHideAsync(); // Prevent auto-hiding the splash screen too soon

const SplashScreenComponent = () => {
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const navigateToHome = async () => {
      try {
        await SplashScreen.hideAsync();

        // Ensure navigation is ready before pushing a new route
        if (navigationRef.isReady()) {
          router.push("/");
        } else {
          console.warn("Navigation not ready yet, retrying...");
          setTimeout(navigateToHome, 500); // Retry after 500ms
        }
      } catch (error) {
        console.error("Error during navigation:", error);
      }
    };

    setTimeout(navigateToHome, 3000);
  }, []);

  return (
    <View style={styles.container}>
      <Image 
        source={require("../assets/images/logo1.png")} 
        style={styles.logo}
      />
      <Text style={styles.appName}>Movie Diary</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  logo: {
    width: 100,
    height: undefined,
    aspectRatio: 1,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 5,
  },
});

export default SplashScreenComponent;
