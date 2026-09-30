import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface ProjectInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <View style={styles.logoBadge}>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.headerTitle}>Informasi Aplikasi</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Hero Card */}
            <View style={styles.heroCard}>
              <Text style={styles.appTitle}>RuangKos</Text>
              <Text style={styles.appSubtitle}>Aplikasi Jadwal Kebersihan Kos</Text>
              
              <View style={styles.groupBadge}>
                <Ionicons name="people" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.groupText}>Kelompok 21</Text>
              </View>
              <Text style={styles.courseText}>Mata Kuliah: Pemrograman Mobile K</Text>
            </View>

            {/* Problem & Solution */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📌 Tentang Produk</Text>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Masalah</Text>
                <Text style={styles.infoValue}>
                  Mahasiswa sering lupa jadwal pembersihan kos, membuang sampah, atau sikat kamar mandi. Pembagian tugas sering tidak jelas.
                </Text>
              </View>
              <View style={[styles.infoBox, { marginTop: 10 }]}>
                <Text style={styles.infoLabel}>Solusi</Text>
                <Text style={styles.infoValue}>
                  RuangKos menyediakan pembuatan jadwal otomatis, checklist tugas interaktif, pengingat, rotasi mingguan, dan skor kebersihan kos.
                </Text>
              </View>
            </View>

            {/* Core Features */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚡ Fitur Utama</Text>
              <FeatureRow icon="calendar-outline" title="Jadwal Piket" desc="Jadwal kebersihan harian & mingguan" />
              <FeatureRow icon="checkbox-outline" title="Checklist Tugas" desc="Tandai tugas yang sudah selesai" />
              <FeatureRow icon="alarm-outline" title="Pengingat Otomatis" desc="Notifikasi saat jadwal kebersihan tiba" />
              <FeatureRow icon="shuffle-outline" title="Pembagian & Rotasi" desc="Acak tugas mingguan secara adil" />
              <FeatureRow icon="stats-chart-outline" title="Riwayat & Leaderboard" desc="Pantau poin & statistik kebersihan" />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          <Pressable onPress={onClose} style={styles.confirmBtn}>
            <Text style={styles.confirmBtnText}>Tutup</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const FeatureRow: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <View style={styles.featureRow}>
    <View style={styles.featureIconBox}>
      <Ionicons name={icon as any} size={18} color={COLORS.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginVertical: SPACING.sm,
  },
  heroCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  groupText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  courseText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
