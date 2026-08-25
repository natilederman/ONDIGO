import { Stack } from 'expo-router';
import { colors } from '../../src/lib/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="trips/new" options={{ title: 'Post a trip', presentation: 'modal' }} />
      <Stack.Screen name="trips/[id]" options={{ title: 'Trip' }} />
      <Stack.Screen name="requests/new" options={{ title: 'Post a request', presentation: 'modal' }} />
      <Stack.Screen name="requests/[id]" options={{ title: 'Request' }} />
      <Stack.Screen name="deliveries/[id]" options={{ title: 'Delivery' }} />
      <Stack.Screen name="profile/[id]" options={{ title: 'Profile' }} />
      <Stack.Screen name="profile/edit" options={{ title: 'Edit profile', presentation: 'modal' }} />
    </Stack>
  );
}
