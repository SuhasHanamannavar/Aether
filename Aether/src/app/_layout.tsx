import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { UserProvider } from '../context/UserContext';
import { TripProvider } from '../context/TripContext';

export default function RootLayout() {
  return (
    <UserProvider>
      <TripProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="integrations" />
          <Stack.Screen name="dream" />
          <Stack.Screen name="new-trip" />
          <Stack.Screen name="trip-canvas" />
          <Stack.Screen name="itinerary" />
          <Stack.Screen name="booking" />
          <Stack.Screen name="prep-hub" />
          <Stack.Screen name="trip-dashboard" />
          <Stack.Screen name="live-mode" />
          <Stack.Screen name="food-finder" />
          <Stack.Screen name="expense-hub" />
          <Stack.Screen name="memory-reel" />
          <Stack.Screen name="feedback" />
          <Stack.Screen name="past-trips" />
        </Stack>
      </TripProvider>
    </UserProvider>
  );
}
