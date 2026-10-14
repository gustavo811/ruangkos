import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoBadge}>
          <Ionicons name="sparkles" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.appName}>RuangKos</Text>
        <Text style={styles.tagline}>Aplikasi Jadwal Kebersihan Kos</Text>
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Memuat sesi penyimpanan aman...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 10,
    fontWeight: '600',
  },
});