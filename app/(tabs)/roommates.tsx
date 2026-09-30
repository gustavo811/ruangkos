import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { RoommateCard } from '../../components/RoommateCard';
import { AddRoommateModal } from '../../components/AddRoommateModal';
import { useApp } from '../../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export default function RoommatesScreen() {
  const { roommates, deleteRoommate } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  // Sort roommates by score (leaderboard)
  const sortedRoommates = [...roommates].sort((a, b) => b.score - a.score);

  const topWinner = sortedRoommates[0];

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title */}
        <View style={styles.topSection}>
          <Text style={styles.pageTitle}>Penghuni Kos 👥</Text>
          <Text style={styles.pageSub}>Daftar anak kos dan papan peringkat rajin piket bulan ini.</Text>
        </View>

        {/* Top Leader Hero Card */}
        {topWinner && (
          <View style={styles.heroLeaderCard}>
            <View style={styles.heroLeft}>
              <View style={styles.crownBadge}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
              </View>
              <View>
                <Text style={styles.heroLabel}>👑 Pahlawan Kebersihan</Text>
                <Text style={styles.heroWinnerName}>{topWinner.name}</Text>
                <Text style={styles.heroSub}>{topWinner.score} Poin • {topWinner.tasksCompletedCount} Tugas Selesai</Text>
              </View>
            </View>
          </View>
        )}

        {/* Header Row with Add Button */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏆 Leaderboard Rajin Piket</Text>
          <Pressable 
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          >
            <Ionicons name="person-add-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Penghuni Baru</Text>
          </Pressable>
        </View>

        {/* Roommates List */}
        {sortedRoommates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={42} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Belum Ada Penghuni Kos</Text>
            <Text style={styles.emptySub}>Klik tombol di atas untuk menambah teman sekamar.</Text>
          </View>
        ) : (
          sortedRoommates.map((r, index) => (
            <RoommateCard
              key={r.id}
              roommate={r}
              rank={index + 1}
              onDelete={deleteRoommate}
            />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <Pressable 
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name="person-add" size={24} color="#FFFFFF" />
      </Pressable>

      <AddRoommateModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
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
  heroLeaderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    ...SHADOWS.medium,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
    marginBottom: 2,
  },
  heroWinnerName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  heroSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pressed: {
    opacity: 0.75,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginTop: 10,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
  },
});
