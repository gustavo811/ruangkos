import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { NotificationProvider } from '../context/NotificationContext';
import { LocationProvider } from '../context/LocationContext';
import { SensorProvider } from '../context/SensorContext';
import { NotificationBanner } from '../components/NotificationBanner';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <LocationProvider>
              <SensorProvider>
                <StatusBar style="dark" />
                <NotificationBanner />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ headerShown: false }} />
                  <Stack.Screen name="location" options={{ headerShown: false }} />
                  <Stack.Screen name="announcement/[id]" options={{ headerShown: false }} />
                </Stack>
              </SensorProvider>
            </LocationProvider>
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
