import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export default function AuthSectionOne() {
  const router = useRouter();
  const { login, quickLogin, rememberedEmail } = useAuth();
  const [email, setEmail] = useState(() => rememberedEmail || 'erling@ruangkos.id');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (rememberedEmail) {
      queueMicrotask(() => {
        setEmail(rememberedEmail);
        if (['erling@ruangkos.id', 'rex@ruangkos.id', 'fiona@ruangkos.id'].includes(rememberedEmail)) {
          setPassword('password123');
        }
      });
    }
  }, [rememberedEmail]);

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Mohon masukkan alamat email kos Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Mohon masukkan kata sandi Anda.');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Silakan setujui Ketentuan Layanan untuk melanjutkan.');
      return;
    }

    setIsSubmitting(true);
    const result = await login({ email, password, rememberMe });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Gagal masuk. Periksa kembali email & kata sandi.');
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
    setIsSubmitting(true);
    const result = await quickLogin(demoEmail);
    setIsSubmitting(false);

    if (result.success) router.replace('/(tabs)');
    else setErrorMessage(result.error || 'Gagal masuk');
  };

  const handleSocialMock = (provider: string) => {
    setErrorMessage(`Fitur masuk dengan ${provider} tersimulasi. Menggunakan akun demo Erling Rascals.`);
    void handleQuickDemo('erling@ruangkos.id', 'password123');
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
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.brandBadge}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.brandBadgeText}>RuangKos K-21</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Secure Storage Ready</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Bersih Cepat,{'\n'}Hidup Lebih Rapi.</Text>
          <Text style={styles.heroSubtitle}>
            Jadwal piket otomatis, rotasi mingguan adil, dan poin kebersihan kos bersama teman sekamar.
          </Text>
          <View style={styles.featurePill}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.secondary} />
            <Text style={styles.featureText}>Hardware Encrypted (Keychain / Keystore)</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.heading}>Masuk ke Akun</Text>
          <Text style={styles.subheading}>Pilih akun demo atau gunakan email terdaftar Anda</Text>

          <View style={styles.socialRow}>
            <Pressable onPress={() => handleSocialMock('Google')} style={styles.socialButton}>
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.socialText}>Google</Text>
            </Pressable>
            <Pressable onPress={() => handleSocialMock('Apple')} style={styles.socialButton}>
              <Ionicons name="logo-apple" size={20} color={COLORS.text} />
              <Text style={styles.socialText}>Apple</Text>
            </Pressable>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau dengan email</Text>
            <View style={styles.dividerLine} />
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.inputLabel}>Email Kos</Text>
          <View style={styles.inputBox}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            <TextInput
              style={styles.input}
              placeholder="nama@ruangkos.id"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.inputLabel}>Kata Sandi</Text>
          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
            <TextInput
              style={styles.input}
              placeholder="Masukkan kata sandi"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={10}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textSecondary}
              />
            </Pressable>
          </View>

          <Pressable onPress={() => setRememberMe(!rememberMe)} style={styles.checkRow}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
            </View>
            <Text style={styles.checkText}>Ingat saya</Text>
          </Pressable>
          <Pressable onPress={() => setAgreeTerms(!agreeTerms)} style={styles.checkRow}>
            <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
              {agreeTerms ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
            </View>
            <Text style={styles.checkText}>Saya menyetujui Ketentuan Layanan</Text>
          </Pressable>

          <Pressable
            disabled={isSubmitting}
            onPress={() => void handleLogin()}
            style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Masuk ke RuangKos</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          <View style={styles.registerRow}>
            <Text style={styles.checkText}>Belum punya akun kos? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Daftar Penghuni Baru</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Akun Uji Coba Demo (1-Klik):</Text>
          <Text style={styles.demoSubtitle}>Pilih akun untuk masuk dengan peran berbeda</Text>
          {DEMO_ACCOUNTS.map((account) => (
            <Pressable
              key={account.user.id}
              disabled={isSubmitting}
              onPress={() => void handleQuickDemo(account.user.email, account.password)}
              style={({ pressed }) => [styles.demoItem, pressed && styles.pressed]}
            >
              <View style={[styles.demoAvatar, { backgroundColor: account.user.avatarColor }]}>
                <Text style={styles.demoAvatarText}>{account.user.name[0]}</Text>
              </View>
              <View style={styles.demoInfo}>
                <Text style={styles.demoName}>{account.user.name}</Text>
                <Text style={styles.demoRole}>{account.user.role} • {account.user.roomNumber}</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={22} color={COLORS.primary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.secondaryLight },
  statusText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  heroTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 34, fontWeight: '800', marginTop: SPACING.lg },
  heroSubtitle: { color: '#F1EFFF', fontSize: 13, lineHeight: 19, marginTop: SPACING.sm },
  featurePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
    marginTop: SPACING.md,
  },
  featureText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.lg,
  },
  heading: { color: COLORS.text, fontSize: 21, fontWeight: '800' },
  subheading: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, marginBottom: SPACING.md },
  socialRow: { flexDirection: 'row', gap: SPACING.sm },
  socialButton: {
    minHeight: 46,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: RADIUS.md,
  },
  socialText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: SPACING.md },
  dividerLine: { height: 1, flex: 1, backgroundColor: COLORS.surfaceBorder },
  dividerText: { color: COLORS.textMuted, fontSize: 11 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    backgroundColor: '#FEF2F2',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.danger, fontSize: 12, flex: 1 },
  inputLabel: { color: COLORS.text, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  inputBox: {
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: SPACING.md,
  },
  input: { flex: 1, color: COLORS.text, fontSize: 13, paddingVertical: 0 },
  eyeButton: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 34 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkText: { color: COLORS.textSecondary, fontSize: 11 },
  loginButton: {
    minHeight: 48,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: SPACING.md },
  registerLink: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  demoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  demoTitle: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  demoSubtitle: { color: COLORS.textSecondary, fontSize: 11, marginTop: 3, marginBottom: SPACING.sm },
  demoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingVertical: 10,
    gap: 10,
  },
  demoAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  demoAvatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  demoInfo: { flex: 1 },
  demoName: { color: COLORS.text, fontSize: 12, fontWeight: '700' },
  demoRole: { color: COLORS.textSecondary, fontSize: 10, marginTop: 2 },
  pressed: { opacity: 0.75 },
});
