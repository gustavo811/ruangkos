import React, { useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Penghuni' | 'Ketua Kos'>('Penghuni');
  const [roomNumber, setRoomNumber] = useState('');
  const [kosName, setKosName] = useState('RuangKos Melati 21');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Mohon masukkan nama lengkap Anda.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Mohon masukkan alamat email yang valid.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }
    if (!roomNumber.trim()) {
      setErrorMessage('Mohon masukkan nomor atau nama kamar Anda.');
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      name,
      email,
      password,
      role,
      roomNumber,
      kosName: kosName || 'RuangKos Melati 21',
      phone,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Gagal mendaftar.');
    } else {
      router.replace('/(tabs)');
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
        {/* Top Bar with Back Button */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>
          <View style={styles.topBadge}>
            <Ionicons name="sparkles" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.topBadgeText}>Daftar Penghuni Baru</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Gabung ke RuangKos 🏡</Text>
          <Text style={styles.subTitle}>
            Daftarkan akunmu untuk mulai berbagi jadwal piket & menjaga kenyamanan bersama.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Rian Hidayat"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="nama@email.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kata Sandi (Min 6 Karakter)</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Minimal 6 karakter"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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

          {/* Peran / Role Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Peran di Kos</Text>
            <View style={styles.roleRow}>
              <Pressable
                onPress={() => setRole('Penghuni')}
                style={[
                  styles.roleCard,
                  role === 'Penghuni' && styles.roleCardActive,
                ]}
              >
                <Ionicons
                  name="person"
                  size={18}
                  color={role === 'Penghuni' ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === 'Penghuni' && styles.roleTextActive,
                  ]}
                >
                  Penghuni Biasa
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setRole('Ketua Kos')}
                style={[
                  styles.roleCard,
                  role === 'Ketua Kos' && styles.roleCardActive,
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={role === 'Ketua Kos' ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === 'Ketua Kos' && styles.roleTextActive,
                  ]}
                >
                  Ketua Kos
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Nomor Kamar & Nama Kos */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>No. Kamar</Text>
              <View style={styles.inputBox}>
                <Ionicons name="key-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Kamar 105"
                  placeholderTextColor={COLORS.textMuted}
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1.2 }]}>
              <Text style={styles.inputLabel}>Nama Kos</Text>
              <View style={styles.inputBox}>
                <Ionicons name="business-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nama Kos"
                  placeholderTextColor={COLORS.textMuted}
                  value={kosName}
                  onChangeText={setKosName}
                />
              </View>
            </View>
          </View>

          {/* Phone (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>No. WhatsApp / HP (Opsional)</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="0812xxxxxxx"
                placeholderTextColor={COLORS.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleRegister}
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
                <Text style={styles.submitText}>Daftar Sekarang</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </View>
            )}
          </Pressable>

          {/* Back to Login */}
          <View style={styles.switchAuthRow}>
            <Text style={styles.switchAuthText}>Sudah punya akun? </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>Masuk di sini</Text>
            </Pressable>
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
    paddingTop: 50,
    paddingBottom: SPACING.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  topBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  titleSection: {
    marginBottom: SPACING.lg,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
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
  rowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
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
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EEF2FF',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  roleTextActive: {
    color: COLORS.primary,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
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
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
