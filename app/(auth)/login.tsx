import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, quickLogin, rememberedEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill remembered email from AsyncStorage
  useEffect(() => {
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      // If remembered email is set, default to password123 for demo convenience
      if (rememberedEmail === 'budi@ruangkos.id' || rememberedEmail === 'agus@ruangkos.id') {
        setPassword('password123');
      }
    } else {
      setEmail('budi@ruangkos.id');
      setPassword('password123');
    }
  }, [rememberedEmail]);

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Mohon masukkan alamat email Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Mohon masukkan kata sandi Anda.');
      return;
    }

    setIsSubmitting(true);
    const res = await login({ email, password, rememberMe });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Gagal masuk. Periksa email & kata sandi.');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
    setIsSubmitting(true);
    const res = await quickLogin(demoEmail);
    setIsSubmitting(false);

    if (res.success) {
      router.replace('/(tabs)');
    } else {
      setErrorMessage(res.error || 'Gagal masuk');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <Ionicons name="sparkles" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.appNameRow}>
            <Text style={styles.appName}>RuangKos</Text>
            <View style={styles.kelompokBadge}>
              <Text style={styles.kelompokText}>K-21</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Selamat Datang Kembali 👋</Text>
          <Text style={styles.heroSub}>
            Kelola piket & kebersihan kos bersama teman sekamar dengan adil & terjadwal.
          </Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.formCard}>
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Kos</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="nama@ruangkos.id"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Kata Sandi</Text>
              <Text style={styles.defaultPassHint}>Demo: password123</Text>
            </View>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Masukkan kata sandi"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={10}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          {/* Remember Me Option */}
          <Pressable
            onPress={() => setRememberMe(!rememberMe)}
            style={styles.rememberRow}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.rememberText}>Ingat saya di perangkat ini (Local Storage)</Text>
          </Pressable>

          {/* Submit Button */}
          <Pressable
            onPress={handleLogin}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.btnPressed,
              isSubmitting && { opacity: 0.8 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.submitRow}>
                <Text style={styles.submitText}>Masuk ke RuangKos</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </View>
            )}
          </Pressable>

          {/* Register Link */}
          <View style={styles.switchAuthRow}>
            <Text style={styles.switchAuthText}>Belum punya akun kos? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Daftar Penghuni Baru</Text>
            </Pressable>
          </View>
        </View>

        {/* 1-Tap Quick Demo Logins */}
        <View style={styles.demoSection}>
          <View style={styles.demoHeader}>
            <Ionicons name="flash" size={16} color={COLORS.warning} style={{ marginRight: 6 }} />
            <Text style={styles.demoTitle}>Akun Demo Cepat (1-Klik):</Text>
          </View>
          <View style={styles.demoPillsRow}>
            {DEMO_ACCOUNTS.map((acc) => (
              <Pressable
                key={acc.user.id}
                onPress={() => handleQuickDemo(acc.user.email, acc.password)}
                style={({ pressed }) => [styles.demoPill, pressed && styles.btnPressed]}
              >
                <View style={[styles.demoAvatar, { backgroundColor: acc.user.avatarColor }]}>
                  <Text style={styles.demoAvatarText}>{acc.user.name[0]}</Text>
                </View>
                <View>
                  <Text style={styles.demoName}>{acc.user.name}</Text>
                  <Text style={styles.demoRole}>
                    {acc.user.role === 'Ketua Kos' ? '👑 Ketua Kos' : '🌿 Penghuni'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Technical Architecture Highlight Badge */}
        <View style={styles.storageBadgeCard}>
          <View style={styles.storageBadgeHeader}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.storageBadgeTitle}>Penyimpanan Dual-Layer Terverifikasi</Text>
          </View>
          <View style={styles.storageItem}>
            <Ionicons name="key" size={14} color={COLORS.primary} style={{ marginTop: 2, marginRight: 6 }} />
            <Text style={styles.storageItemText}>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>Secure Storage (Expo SecureStore): </Text>
              Token autentikasi & session ID dienkripsi secara hardware (Keychain/Keystore).
            </Text>
          </View>
          <View style={styles.storageItem}>
            <Ionicons name="file-tray-full" size={14} color={COLORS.secondary} style={{ marginTop: 2, marginRight: 6 }} />
            <Text style={styles.storageItemText}>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>Local Storage (AsyncStorage): </Text>
              Profil penghuni, email tersimpan, & preferensi tersimpan aman secara offline.
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 54,
    paddingBottom: SPACING.xl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.medium,
  },
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  kelompokBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginLeft: 8,
  },
  kelompokText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: '90%',
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
    marginBottom: SPACING.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  defaultPassHint: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    ...SHADOWS.small,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  switchAuthText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  demoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  demoPillsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  demoAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  demoAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  demoName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  demoRole: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  storageBadgeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  storageBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageBadgeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  storageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  storageItemText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
});
