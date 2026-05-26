import { Stack } from 'expo-router';
import { FavoritesProvider } from '../context/FavoritesContext';

export default function RootLayout() {
  return (
    // Wrap the entire app so every screen has access to the favorites array
    <FavoritesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="municipality-list" />
      </Stack>
    </FavoritesProvider>
  );
}