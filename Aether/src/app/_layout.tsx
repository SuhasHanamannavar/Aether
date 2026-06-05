import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="confirm" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="integrations" />
        <Stack.Screen name="dream" />
        <Stack.Screen name="new-trip" />
        <Stack.Screen name="trip-canvas" />
        <Stack.Screen name="itinerary" />
        <Stack.Screen name="booking" />
      </Stack>
    </>
  );
}
