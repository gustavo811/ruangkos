import React from 'react';
import { 
  StyleSheet, Text, View, ScrollView, Pressable, Switch, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { useApp } from '../../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export default function HistoryScreen() {
  const { 
    history, settings, updateSettings, resetToDefaultData, cleanlinessScore 
  } = useApp();

  const handleResetData = () => {
    Alert.alert(
      'Reset Data Demo',
      'Apakah Anda yakin ingin mengembalikan data ke kondisi awal?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Reset Sekarang', style: 'destructive', onPress: () => resetToDefaultData() },
      ]
    );
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Baru saja';
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.topSection}>
          <Text style={styles.pageTitle}>Riwayat & Pengaturan 📊</Text>
          <Text style={styles.pageSub}>Jejak aktivitas kebersihan kos dan penyesuaian aplikasi.</Text>
        </View>

        {/* Stats Summary Widget */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{history.length}</Text>
            <Text style={styles.statLbl}>Aktivitas Selesai</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: COLORS.secondary }]}>{cleanlinessScore}%</Text>
            <Text style={styles.statLbl}>Indeks Kebersihan</Text>
          </View>
        </View>

        {/* Activity Log Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📜 Catatan Aktivitas Terakhir</Text>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="journal-outline" size={42} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Belum Ada Riwayat Selesai</Text>
            <Text style={styles.emptySub}>Tugas yang kamu tandai selesai akan otomatis tercatat di sini.</Text>
          </View>
        ) : (
          history.slice(0, 10).map(item => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyIconCircle}>
                <Ionicons name="checkmark-done-circle" size={24} color={COLORS.secondary} />
              </View>

              <View style={styles.historyTextCol}>
                <Text style={styles.historyTaskTitle}>{item.taskTitle}</Text>
                <Text style={styles.historySub}>
                  Oleh <Text style={styles.historyName}>{item.completedByRoommateName}</Text> • {formatDate(item.completedAt)}
                </Text>
              </View>

              <View style={styles.pointBadge}>
                <Text style={styles.pointText}>+{item.pointsEarned} Poin</Text>
              </View>
            </View>
          ))
        )}

        {/* Settings Section */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <Text style={styles.sectionTitle}>⚙️ Pengaturan & Notifikasi</Text>
        </View>

        <View style={styles.settingsCard}>
          {/* Sound Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-high-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.settingTitle}>Suara Notifikasi</Text>
                <Text style={styles.settingSub}>Bunyi saat jadwal piket tiba</Text>
              </View>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={val => updateSettings({ soundEnabled: val })}
              trackColor={{ false: COLORS.surfaceMuted, true: COLORS.primaryLight }}
              thumbColor={settings.soundEnabled ? COLORS.primary : '#FFFFFF'}
            />
          </View>

          {/* Haptic Toggle */}
          <View style={[styles.settingRow, styles.settingBorder]}>
            <View style={styles.settingLeft}>
              <Ionicons name="hand-right-outline" size={20} color={COLORS.secondary} style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.settingTitle}>Haptic Feedback (Getaran)</Text>
                <Text style={styles.settingSub}>Efek getar saat tombol/check diselesaikan</Text>
              </View>
            </View>
            <Switch
              value={settings.hapticEnabled}
              onValueChange={val => updateSettings({ hapticEnabled: val })}
              trackColor={{ false: COLORS.surfaceMuted, true: COLORS.secondaryLight }}
              thumbColor={settings.hapticEnabled ? COLORS.secondary : '#FFFFFF'}
            />
          </View>

          {/* Auto Rotate Toggle */}
          <View style={[styles.settingRow, styles.settingBorder]}>
            <View style={styles.settingLeft}>
              <Ionicons name="repeat-outline" size={20} color={COLORS.warning} style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.settingTitle}>Rotasi Piket Mingguan</Text>
                <Text style={styles.settingSub}>Otomatis acak tugas per minggu</Text>
              </View>
            </View>
            <Switch
              value={settings.autoRotateWeekly}
              onValueChange={val => updateSettings({ autoRotateWeekly: val })}
              trackColor={{ false: COLORS.surfaceMuted, true: '#FDE68A' }}
              thumbColor={settings.autoRotateWeekly ? COLORS.warning : '#FFFFFF'}
            />
          </View>

          {/* Reset Button */}
          <Pressable 
            onPress={handleResetData}
            style={({ pressed }) => [styles.resetBtn, pressed && styles.pressed]}
          >
            <Ionicons name="refresh-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.resetBtnText}>Reset Data Demo Ke Default</Text>
          </Pressable>
        </View>

        {/* Footer Credit */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>RuangKos Mobile App • Kelompok 21</Text>
          <Text style={styles.footerSub}>Pemrograman Mobile K • 2026</Text>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  topSection: {
    marginBottom: SPACING.md,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  pageSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  statVal: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  historyIconCircle: {
    marginRight: 12,
  },
  historyTextCol: {
    flex: 1,
  },
  historyTaskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  historySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyName: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  pointBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  pointText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginTop: 10,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  pressed: {
    opacity: 0.75,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  footerSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
