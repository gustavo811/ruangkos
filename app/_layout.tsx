import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { SensorProvider } from '../context/SensorContext';
import { NotificationBanner } from '../components/NotificationBanner';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <SensorProvider>
            <StatusBar style="dark" />
            <NotificationBanner />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </SensorProvider>
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
