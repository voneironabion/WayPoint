import { Quicksand_700Bold, useFonts } from '@expo-google-fonts/quicksand';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const COLORS = {
  bgTerracotta: '#C9442A', 
  cream: '#F6F2E6', 
  darkText: '#3A3A3A' 
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Quicksand_700Bold });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* TRUE CENTER LOGO AREA */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logos/logo map (w).png')} 
            style={styles.logoImage} 
          />
          <Text style={styles.appName}>waypoint</Text>
        </View>

        {/* BOTTOM BUTTON */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.replace('/(tabs)')} 
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Start Exploring</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgTerracotta, 
  },
  content: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -80, // Nudges the entire block up to hit the true optical center
  },
  logoImage: {
    width: 320, 
    height: 320, 
    resizeMode: 'contain',
    marginBottom: -50, // Closes the gap between the logo and the text
  },
  appName: {
    fontFamily: 'Quicksand_700Bold',
    fontSize: 56, 
    color: COLORS.cream,
    letterSpacing: -1.5,
  },
  button: {
    position: 'absolute', 
    bottom: 60, 
    backgroundColor: COLORS.cream,
    width: '85%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: COLORS.darkText, 
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
  }
});