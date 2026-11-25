import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { NotificationProvider } from '../context/NotificationContext';
import { SensorProvider } from '../context/SensorContext';
import { NotificationBanner } from '../components/NotificationBanner';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppProvider>
          <NotificationProvider>
            <SensorProvider>
              <StatusBar style="dark" />
              <NotificationBanner />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
                <Stack.Screen name="announcement/[id]" options={{ headerShown: false }} />
              </Stack>
            </SensorProvider>
          </NotificationProvider>
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
