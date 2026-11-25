import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNotifications } from '../../context/NotificationContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { NotificationCategory } from '../../types';

export default function AnnouncementDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notifications } = useNotifications();

  const announcement = notifications.find((n) => n.id === id) || notifications[0];

  const getCategoryMeta = (cat?: NotificationCategory) => {
    switch (cat) {
      case 'jadwal_piket':
        return { label: 'Jadwal Piket', icon: 'calendar' as const, color: COLORS.secondary };
      case 'rotasi':
        return { label: 'Rotasi Mingguan', icon: 'shuffle' as const, color: COLORS.accentBlue };
      case 'kebersihan':
        return { label: 'Pengingat Kebersihan', icon: 'sparkles' as const, color: COLORS.warning };
      case 'pengumuman':
      default:
        return { label: 'Pengumuman Kos', icon: 'megaphone' as const, color: COLORS.primary };
    }
  };

  const catMeta = getCategoryMeta(announcement?.category);

  const formatDateTime = (iso?: string) => {
    if (!iso) return 'Baru saja';
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <View style={styles.container}>
      {/* Slide Step 7 Style Top Bar: ← RUANGKOS | Detail Pengumuman */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          <Text style={styles.backText}>RUANGKOS</Text>
        </Pressable>
        <View style={styles.stepPill}>
          <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
          <Text style={styles.stepPillText}>Step 7 Terbuka</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          <Text style={styles.pageHeading}>Detail Pengumuman</Text>

          {/* Hero Icon */}
          <View style={[styles.heroIconWrap, { backgroundColor: catMeta.color + '18' }]}>
            <Ionicons name={catMeta.icon} size={42} color={catMeta.color} />
          </View>

          <View style={[styles.catBadge, { backgroundColor: catMeta.color + '18' }]}>
            <Text style={[styles.catBadgeText, { color: catMeta.color }]}>{catMeta.label}</Text>
          </View>

          <Text style={styles.title}>
            {announcement?.title || 'Pengumuman Baru RuangKos'}
          </Text>

          <View style={styles.metaInfoRow}>
            <Ionicons name="person-circle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaInfoText}>
              {announcement?.sender || 'Ketua Kos RuangKos'} • {formatDateTime(announcement?.receivedAt)}
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.bodyText}>
            {announcement?.body ||
              'Notifikasi berhasil diterima oleh perangkat dan membuka halaman Detail Pengumuman tujuan di RuangKos.'}
          </Text>
        </View>

        {/* Notification Payload & Deep-Link Audit Card */}
        <View style={styles.payloadCard}>
          <View style={styles.payloadHeader}>
            <Ionicons name="code-slash-outline" size={16} color={COLORS.primary} />
            <Text style={styles.payloadTitle}>Payload Navigasi Push Notification</Text>
          </View>

          <View style={styles.payloadRow}>
            <Text style={styles.payloadKey}>ID Notifikasi</Text>
            <Text style={styles.payloadVal}>{announcement?.id || id || '-'}</Text>
          </View>
          <View style={styles.payloadRow}>
            <Text style={styles.payloadKey}>Target Route</Text>
            <Text style={styles.payloadVal}>
              {announcement?.targetRoute || `/announcement/${id}`}
            </Text>
          </View>
          <View style={styles.payloadRow}>
            <Text style={styles.payloadKey}>Channel</Text>
            <Text style={styles.payloadVal}>{announcement?.deliveryChannel || 'local_notification'}</Text>
          </View>
          {announcement?.ticketId && (
            <View style={styles.payloadRow}>
              <Text style={styles.payloadKey}>Push Ticket</Text>
              <Text style={styles.payloadVal}>{announcement.ticketId}</Text>
            </View>
          )}

          <View style={styles.jsonBox}>
            <Text style={styles.jsonText}>
              {JSON.stringify(
                announcement?.data || {
                  announcementId: id,
                  targetRoute: `/announcement/${id}`,
                },
                null,
                2
              )}
            </Text>
          </View>
        </View>

        {/* Action Shortcuts to App Features */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsHeading}>Navigasi ke Fitur Terkait</Text>

          <Pressable
            onPress={() => router.push('/(tabs)/checklist' as any)}
            style={({ pressed }) => [styles.featureBtn, pressed && styles.pressed]}
          >
            <Ionicons name="checkbox-outline" size={18} color={COLORS.primary} />
            <Text style={styles.featureBtnText}>Buka Checklist Tugas Kebersihan</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/schedule' as any)}
            style={({ pressed }) => [styles.featureBtn, pressed && styles.pressed]}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.secondary} />
            <Text style={styles.featureBtnText}>Lihat Jadwal Piket Mingguan</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/notifications' as any)}
            style={({ pressed }) => [styles.primaryBackBtn, pressed && styles.pressed]}
          >
            <Ionicons name="notifications-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.primaryBackBtnText}>Kembali ke Demo Push Notification</Text>
          </Pressable>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: SPACING.lg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  stepPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  pageHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  catBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: 10,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: 16,
  },
  bodyText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  payloadCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  payloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  payloadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  payloadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceMuted,
  },
  payloadKey: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  payloadVal: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '700',
  },
  jsonBox: {
    marginTop: 10,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.md,
    padding: 12,
  },
  jsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#A7F3D0',
  },
  actionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  actionsHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  featureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  featureBtnText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  primaryBackBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  primaryBackBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});

