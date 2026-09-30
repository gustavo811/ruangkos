import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, Pressable, FlatList 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { CleanlinessProgressCard } from '../../components/CleanlinessProgressCard';
import { TaskCard } from '../../components/TaskCard';
import { AddTaskModal } from '../../components/AddTaskModal';
import { useApp } from '../../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { DayOfWeek } from '../../types';

export default function HomeScreen() {
  const { tasks, roommates, rotateWeeklySchedule, triggerNotification } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  // Get Current Day of Week in Indonesian
  const getCurrentDayIndo = (): DayOfWeek => {
    const dayNames: DayOfWeek[] = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    return dayNames[now.getDay()];
  };

  const today = getCurrentDayIndo();

  // Tasks for today or 'Setiap Hari'
  const todayTasks = tasks.filter(t => t.assignedDay === today || t.assignedDay === 'Setiap Hari');

  // Who is on duty today?
  const todayRoommateIds = Array.from(new Set(todayTasks.map(t => t.assignedRoommateId)));
  const todayDutyRoommates = roommates.filter(r => todayRoommateIds.includes(r.id));

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress & Overview Card */}
        <CleanlinessProgressCard onAddTask={() => setModalVisible(true)} />

        {/* Quick Action Bar */}
        <View style={styles.quickBar}>
          <Pressable 
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.actionTitle}>Tambah</Text>
            <Text style={styles.actionSub}>Tugas Piket</Text>
          </Pressable>

          <Pressable 
            onPress={rotateWeeklySchedule}
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="shuffle" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.actionTitle}>Acak Jadwal</Text>
            <Text style={styles.actionSub}>Rotasi Mingguan</Text>
          </Pressable>

          <Pressable 
            onPress={() => triggerNotification('🔔 Waktunya Kebersihan!', 'Pengingat otomatis piket kos telah diaktifkan.')}
            style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="alarm" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.actionTitle}>Pengingat</Text>
            <Text style={styles.actionSub}>Tes Notifikasi</Text>
          </Pressable>
        </View>

        {/* Today's Duty Hero Section */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="sparkles" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Piket Hari Ini ({today})</Text>
          </View>
          <Text style={styles.sectionBadge}>{todayTasks.length} Tugas</Text>
        </View>

        {/* Duty Roommates Badge Banner */}
        {todayDutyRoommates.length > 0 && (
          <View style={styles.dutyBanner}>
            <Text style={styles.dutyBannerLabel}>👑 Petugas Piket Hari Ini:</Text>
            <View style={styles.dutyAvatarsRow}>
              {todayDutyRoommates.map(r => (
                <View key={r.id} style={styles.dutyBadge}>
                  <View style={[styles.dutyAvatar, { backgroundColor: r.avatarColor }]}>
                    <Text style={styles.dutyAvatarText}>{r.name[0]}</Text>
                  </View>
                  <Text style={styles.dutyName}>{r.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Today's Task List */}
        {todayTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="happy-outline" size={42} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Tidak ada piket hari ini!</Text>
            <Text style={styles.emptySub}>Nikmati hari santai di kos, atau tambah tugas baru jika perlu.</Text>
          </View>
        ) : (
          todayTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        )}

        {/* All Remaining Tasks Overview */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <Text style={styles.sectionTitle}>📋 Semua Jadwal Kebersihan</Text>
          <Text style={styles.sectionBadge}>{tasks.length} Total</Text>
        </View>

        {tasks.map(task => (
          <TaskCard key={`all-${task.id}`} task={task} />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable 
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <AddTaskModal 
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
  quickBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  actionCard: {
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
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  actionSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  dutyBanner: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  dutyBannerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  dutyAvatarsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginRight: 8,
    marginBottom: 4,
  },
  dutyAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  dutyAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  dutyName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
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
