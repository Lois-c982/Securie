//this file is the root layout for the app, and it wraps the entire app in a favourites provider and a status bar. It also defines the initial route for the app.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { FavouritesProvider } from '@/lib/favourites';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <FavouritesProvider>
      <StatusBar style="dark" />

       {/* Login opens first. The main app opens after login or guest access. */}
      <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </FavouritesProvider>
  );
}