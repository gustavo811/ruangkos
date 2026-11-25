import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { NotificationCategory, PushNotificationRecord } from '../types';

interface PresetTemplate {
  key: string;
  label: string;
  category: NotificationCategory;
  title: string;
  body: string;
  targetRoute?: string;
}

const PRESETS: PresetTemplate[] = [
  {
    key: 'pengumuman',
    label: '📢 Pengumuman Baru',
    category: 'pengumuman',
    title: 'Pengumuman Baru Kos',
    body: 'Jadwal kebersihan & piket kos minggu ini telah diperbarui. Silakan cek detail pembagian tugas.',
  },
  {
    key: 'piket',
    label: '🧹 Pengingat Piket',
    category: 'jadwal_piket',
    title: 'Pengingat Piket Hari Ini!',
    body: 'Waktunya membersihkan area kos sesuai jadwal piket hari ini. Ketuk untuk lihat detail pengumuman.',
  },
  {
    key: 'rotasi',
    label: '🔄 Rotasi Mingguan',
    category: 'rotasi',
    title: 'Rotasi Piket Mingguan Aktif',
    body: 'Giliran tugas kebersihan antar penghuni telah dirotasi secara adil oleh Ketua Kos.',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { triggerNotification } = useApp();
  const {
    appInitialized,
    permissionStatus,
    registeredDevice,
    expoPushToken,
    tokenType,
    tokenNote,
    lastDispatch,
    notifications,
    unreadCount,
    hasReceivedNotification,
    hasOpenedNotification,
    isBusy,
    requestPermission,
    denyPermissionDemo,
    fetchPushToken,
    registerDevice,
    setupPushPipeline,
    sendPushNotification,
    openNotification,
    markAllAsRead,
    resetDemoState,
  } = useNotifications();

  const [selectedPreset, setSelectedPreset] = useState<string>('pengumuman');
  const [title, setTitle] = useState(PRESETS[0].title);
  const [body, setBody] = useState(PRESETS[0].body);
  const [category, setCategory] = useState<NotificationCategory>('pengumuman');
  const [delaySeconds, setDelaySeconds] = useState<number>(0);

  const steps = [
    { num: 1, label: 'Jalankan Aplikasi', done: appInitialized },
    { num: 2, label: 'Minta Permission', done: permissionStatus === 'granted' },
    { num: 3, label: 'Registrasi Perangkat', done: !!registeredDevice },
    { num: 4, label: 'Dapatkan Push Token', done: !!expoPushToken },
    { num: 5, label: 'Kirim Notifikasi', done: !!lastDispatch },
    { num: 6, label: 'Terima Notifikasi', done: hasReceivedNotification },
    { num: 7, label: 'Tekan & Buka Halaman', done: hasOpenedNotification },
  ];

  const completedStepsCount = steps.filter((s) => s.done).length;
  const allCompleted = completedStepsCount === 7;

  const handleSelectPreset = (preset: PresetTemplate) => {
    setSelectedPreset(preset.key);
    setTitle(preset.title);
    setBody(preset.body);
    setCategory(preset.category);
  };

  const handleCopyOrShareToken = async () => {
    if (!expoPushToken) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(expoPushToken);
        triggerNotification('📋 Push Token Disalin', expoPushToken);
        return;
      } catch {
        // fallback below
      }
    }
    try {
      await Share.share({ message: expoPushToken });
    } catch {
      Alert.alert('Expo Push Token', expoPushToken);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Lengkapi Pesan', 'Judul dan isi notifikasi tidak boleh kosong.');
      return;
    }
    await sendPushNotification({
      title: title.trim(),
      subtitle: 'RuangKos Push Demo',
      body: body.trim(),
      category,
      delaySeconds,
    });
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Sekarang';
    }
  };

  const renderPermissionBadge = () => {
    if (permissionStatus === 'granted') {
      return { label: 'Diizinkan (Granted)', bg: '#DCFCE7', color: '#15803D' };
    }
    if (permissionStatus === 'denied') {
      return { label: 'Ditolak (Denied)', bg: '#FEE2E2', color: '#DC2626' };
    }
    return { label: 'Belum Diminta', bg: '#FEF3C7', color: '#92400E' };
  };

  const permBadge = renderPermissionBadge();

  return (
    <View style={styles.container}>
      {/* Custom Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Push Notification</Text>
            <View style={styles.sprintBadge}>
              <Text style={styles.sprintBadgeText}>Sprint 09</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>Demo Integrasi 7 Langkah • RuangKos</Text>
        </View>

        <Pressable
          onPress={() => void resetDemoState()}
          style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
        >
          <Ionicons name="refresh" size={16} color={COLORS.primary} />
          <Text style={styles.resetBtnText}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner & 7-Step Pipeline Tracker */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconBox}>
              <Ionicons name="megaphone" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Alur Push Notification RuangKos</Text>
              <Text style={styles.heroSub}>
                {completedStepsCount}/7 langkah terintegrasi dari permission hingga navigasi ke halaman tujuan.
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round((completedStepsCount / 7) * 100)}%` },
              ]}
            />
          </View>

          {/* Horizontal 7-Step Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepsStrip}>
            {steps.map((step) => (
              <View
                key={step.num}
                style={[styles.stepPill, step.done && styles.stepPillDone]}
              >
                <View style={[styles.stepNumCircle, step.done && styles.stepNumCircleDone]}>
                  {step.done ? (
                    <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                  ) : (
                    <Text style={styles.stepNumText}>{step.num}</Text>
                  )}
                </View>
                <Text style={[styles.stepPillLabel, step.done && styles.stepPillLabelDone]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* 1-Tap Setup Button */}
          <Pressable
            onPress={() => void setupPushPipeline()}
            disabled={isBusy}
            style={({ pressed }) => [styles.quickSetupBtn, pressed && styles.pressed]}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="flash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.quickSetupBtnText}>
              Setup Cepat (Permission + Token + Registrasi Perangkat)
            </Text>
          </Pressable>
        </View>

        {/* STEP 1: JALANKAN APLIKASI */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Jalankan Aplikasi</Text>
              <Text style={styles.stepDesc}>
                Handler notifikasi foreground & channel Android diinisialisasi saat aplikasi dibuka.
              </Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.statusTagText, { color: '#15803D' }]}>Aktif</Text>
            </View>
          </View>
        </View>

        {/* STEP 2: MINTA PERMISSION */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Minta Permission</Text>
              <Text style={styles.stepDesc}>Meminta izin notifikasi dari sistem perangkat.</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: permBadge.bg }]}>
              <Text style={[styles.statusTagText, { color: permBadge.color }]}>
                {permBadge.label}
              </Text>
            </View>
          </View>

          <View style={styles.permissionMockBox}>
            <View style={styles.permissionBellCircle}>
              <Ionicons name="notifications" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.permissionPromptTitle}>Izinkan notifikasi?</Text>
            <Text style={styles.permissionPromptSub}>
              RuangKos membutuhkan izin untuk mengirim pengingat piket dan pengumuman kos.
            </Text>
            <View style={styles.permissionActionsRow}>
              <Pressable
                onPress={denyPermissionDemo}
                style={({ pressed }) => [styles.denyBtn, pressed && styles.pressed]}
              >
                <Text style={styles.denyBtnText}>Tolak</Text>
              </Pressable>
              <Pressable
                onPress={() => void requestPermission()}
                disabled={isBusy}
                style={({ pressed }) => [styles.allowBtn, pressed && styles.pressed]}
              >
                <Text style={styles.allowBtnText}>Izinkan</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* STEP 3: REGISTRASI PERANGKAT */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Registrasi Perangkat</Text>
              <Text style={styles.stepDesc}>
                Mendaftarkan perangkat & identitas penghuni ke endpoint API RuangKos.
              </Text>
            </View>
            <View
              style={[
                styles.statusTag,
                { backgroundColor: registeredDevice ? '#DCFCE7' : '#F1F5F9' },
              ]}
            >
              <Text
                style={[
                  styles.statusTagText,
                  { color: registeredDevice ? '#15803D' : COLORS.textSecondary },
                ]}
              >
                {registeredDevice ? 'Terdaftar' : 'Belum'}
              </Text>
            </View>
          </View>

          {registeredDevice ? (
            <View style={styles.registeredBox}>
              <View style={styles.registeredIcon}>
                <Ionicons name="phone-portrait" size={22} color={COLORS.primary} />
                <View style={styles.registeredCheck}>
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.registeredTitle}>Perangkat Terdaftar</Text>
                <Text style={styles.registeredMeta}>
                  {registeredDevice.deviceName} • {registeredDevice.platform} {registeredDevice.osVersion}
                </Text>
                <Text style={styles.registeredMeta}>
                  Kos: {registeredDevice.kosName} • {formatTime(registeredDevice.registeredAt)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.mutedInfo}>
              Perangkat belum didaftarkan ke server notifikasi RuangKos.
            </Text>
          )}

          <Pressable
            onPress={() => void registerDevice()}
            disabled={isBusy}
            style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
          >
            <Ionicons name="cloud-upload-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.secondaryActionBtnText}>
              {registeredDevice ? 'Perbarui Registrasi Perangkat' : 'Daftarkan Perangkat Sekarang'}
            </Text>
          </Pressable>
        </View>

        {/* STEP 4: DAPATKAN PUSH TOKEN */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Dapatkan Push Token</Text>
              <Text style={styles.stepDesc}>
                Mengambil token unik ExponentPushToken untuk pengiriman pesan jarak jauh.
              </Text>
            </View>
          </View>

          <View style={styles.tokenBox}>
            <View style={styles.tokenHeaderRow}>
              <View style={styles.tokenCodeBadge}>
                <Text style={styles.tokenCodeBadgeText}>{'{}'}</Text>
              </View>
              <Text style={styles.tokenLabel}>Push Token</Text>
              {tokenType && (
                <View
                  style={[
                    styles.tokenTypePill,
                    { backgroundColor: tokenType === 'expo' ? '#DCFCE7' : '#EEF2FF' },
                  ]}
                >
                  <Text
                    style={[
                      styles.tokenTypeText,
                      { color: tokenType === 'expo' ? '#15803D' : COLORS.primary },
                    ]}
                  >
                    {tokenType === 'expo' ? 'Expo Asli' : 'Preview Mode'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.tokenValueRow}>
              <Text style={styles.tokenValueText} selectable>
                {expoPushToken || 'ExponentPushToken[Belum diambil]'}
              </Text>
              {expoPushToken && (
                <Pressable onPress={() => void handleCopyOrShareToken()} style={styles.copyIconBtn}>
                  <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
                </Pressable>
              )}
            </View>

            {tokenNote && <Text style={styles.tokenNoteText}>{tokenNote}</Text>}
          </View>

          <Pressable
            onPress={() => void fetchPushToken()}
            disabled={isBusy}
            style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}
          >
            <Ionicons name="key-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.secondaryActionBtnText}>
              {expoPushToken ? 'Refresh Push Token' : 'Dapatkan Push Token'}
            </Text>
          </Pressable>
        </View>

        {/* STEP 5: KIRIM NOTIFIKASI */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>5</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Kirim Notifikasi</Text>
              <Text style={styles.stepDesc}>
                Mengirim notifikasi melalui server/provider (Expo Push API & Local Dispatcher).
              </Text>
            </View>
          </View>

          {/* Preset Templates */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {PRESETS.map((p) => {
              const active = selectedPreset === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => handleSelectPreset(p)}
                  style={[styles.presetChip, active && styles.presetChipActive]}
                >
                  <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.inputLabel}>Judul Notifikasi</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Contoh: Pengumuman Baru Kos"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.inputLabel}>Isi Pesan</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={body}
            onChangeText={setBody}
            placeholder="Tulis isi pengumuman atau pengingat..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
          />

          {/* Delay selector */}
          <View style={styles.delayRow}>
            <Text style={styles.delayLabel}>Waktu Pengiriman:</Text>
            <View style={styles.delayChips}>
              {[0, 3].map((sec) => (
                <Pressable
                  key={sec}
                  onPress={() => setDelaySeconds(sec)}
                  style={[styles.delayChip, delaySeconds === sec && styles.delayChipActive]}
                >
                  <Text
                    style={[
                      styles.delayChipText,
                      delaySeconds === sec && styles.delayChipTextActive,
                    ]}
                  >
                    {sec === 0 ? 'Langsung' : `Tunda ${sec} dtk`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => void handleSend()}
            disabled={isBusy}
            style={({ pressed }) => [styles.primarySendBtn, pressed && styles.pressed]}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="paper-plane" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.primarySendBtnText}>Kirim Notifikasi Sekarang</Text>
          </Pressable>

          {lastDispatch && (
            <View style={styles.dispatchResultBox}>
              <Ionicons name="checkmark-done-circle" size={18} color={COLORS.secondary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.dispatchResultTitle}>
                  Notifikasi Terkirim ({lastDispatch.ticketStatus.toUpperCase()})
                </Text>
                <Text style={styles.dispatchResultSub}>
                  Ticket: {lastDispatch.ticketId} • {lastDispatch.providerNote}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* STEP 6 & 7: TERIMA NOTIFIKASI + TEKAN & BUKA HALAMAN */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>6-7</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Terima, Tekan & Buka Halaman</Text>
              <Text style={styles.stepDesc}>
                Ketuk notifikasi di bawah (atau banner sistem/layar kunci) untuk membuka Detail Pengumuman.
              </Text>
            </View>
            {unreadCount > 0 && (
              <Pressable onPress={() => void markAllAsRead()} style={styles.markReadBtn}>
                <Text style={styles.markReadText}>Tandai Dibaca</Text>
              </Pressable>
            )}
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyInbox}>
              <Ionicons name="mail-open-outline" size={34} color={COLORS.textMuted} />
              <Text style={styles.emptyInboxText}>
                Belum ada notifikasi diterima. Kirim notifikasi pada Langkah 5 di atas.
              </Text>
            </View>
          ) : (
            notifications.map((item: PushNotificationRecord) => (
              <Pressable
                key={item.id}
                onPress={() => openNotification(item)}
                style={({ pressed }) => [
                  styles.notifPreviewCard,
                  !item.isRead && styles.notifPreviewUnread,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.notifTopMeta}>
                  <View style={styles.notifAppTag}>
                    <Ionicons name="sparkles" size={12} color={COLORS.primary} />
                    <Text style={styles.notifAppTagText}>RuangKos</Text>
                  </View>
                  <Text style={styles.notifTimeText}>
                    {formatTime(item.receivedAt)} {!item.isRead ? '• Baru' : ''}
                  </Text>
                </View>

                <Text style={styles.notifItemTitle}>{item.title}</Text>
                <Text style={styles.notifItemBody} numberOfLines={2}>
                  {item.body}
                </Text>

                <View style={styles.notifFooterRow}>
                  <View style={styles.channelBadge}>
                    <Text style={styles.channelBadgeText}>
                      {item.deliveryChannel === 'expo_push_api' ? 'Expo Push API' : 'Device Push'}
                    </Text>
                  </View>
                  <View style={styles.openCtaRow}>
                    <Text style={styles.openCtaText}>Tekan & Buka Halaman</Text>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* Bottom Sprint 09 Completion Banner */}
        <View
          style={[
            styles.completionBanner,
            allCompleted ? styles.completionBannerSuccess : styles.completionBannerPending,
          ]}
        >
          <View
            style={[
              styles.completionIconCircle,
              { backgroundColor: allCompleted ? COLORS.secondary : COLORS.primary },
            ]}
          >
            <Ionicons
              name={allCompleted ? 'checkmark-done' : 'rocket-outline'}
              size={20}
              color="#FFFFFF"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.completionTitle}>
              {allCompleted
                ? 'Sprint 09 Completed! (7/7 Langkah)'
                : `Progress Integrasi (${completedStepsCount}/7 Langkah)`}
            </Text>
            <Text style={styles.completionDesc}>
              {allCompleted
                ? 'Push Notification di RuangKos berhasil diintegrasikan mulai dari registrasi perangkat hingga navigasi ke fitur.'
                : 'Selesaikan langkah 2–7 di atas (akhiri dengan mengetuk notifikasi yang diterima) untuk memverifikasi seluruh alur.'}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 54,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  sprintBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  sprintBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.medium,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconBox: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  heroSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.full,
  },
  stepsStrip: {
    marginBottom: 12,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  stepPillDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  stepNumCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  stepNumCircleDone: {
    backgroundColor: COLORS.secondary,
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  stepPillLabelDone: {
    color: '#065F46',
  },
  quickSetupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  quickSetupBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  stepCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 6,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.text,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  stepDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
    lineHeight: 17,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  permissionMockBox: {
    marginTop: 14,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  permissionBellCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionPromptTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  permissionPromptSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 17,
  },
  permissionActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  denyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
  },
  denyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  allowBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentBlue,
    alignItems: 'center',
  },
  allowBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  registeredBox: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  registeredIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  registeredCheck: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  registeredTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  registeredMeta: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  mutedInfo: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },
  secondaryActionBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tokenBox: {
    marginTop: 12,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tokenHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenCodeBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tokenCodeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  tokenLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  tokenTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  tokenTypeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tokenValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tokenValueText: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: COLORS.text,
  },
  copyIconBtn: {
    padding: 4,
    marginLeft: 6,
  },
  tokenNoteText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 15,
  },
  presetScroll: {
    marginTop: 12,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  presetChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: COLORS.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  presetChipTextActive: {
    color: COLORS.primary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  delayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  delayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  delayChips: {
    flexDirection: 'row',
    gap: 8,
  },
  delayChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  delayChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: COLORS.primary,
  },
  delayChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  delayChipTextActive: {
    color: COLORS.primary,
  },
  primarySendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentBlue,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  primarySendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  dispatchResultBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dispatchResultTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  dispatchResultSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  markReadBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyInbox: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyInboxText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  notifPreviewCard: {
    marginTop: 12,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  notifPreviewUnread: {
    backgroundColor: '#F5F3FF',
    borderColor: COLORS.primaryLight,
  },
  notifTopMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifAppTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notifAppTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  notifTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 3,
  },
  notifItemBody: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  notifFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  channelBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  channelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  openCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 2,
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
  },
  completionBannerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: COLORS.secondary,
  },
  completionBannerPending: {
    backgroundColor: '#EEF2FF',
    borderColor: COLORS.primaryLight,
  },
  completionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  completionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});

