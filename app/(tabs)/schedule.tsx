import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { TaskCard } from '../../components/TaskCard';
import { AddTaskModal } from '../../components/AddTaskModal';
import { useApp } from '../../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { DayOfWeek } from '../../types';

export default function ScheduleScreen() {
  const { tasks, roommates, rotateWeeklySchedule } = useApp();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Senin');
  const [modalVisible, setModalVisible] = useState(false);

  const daysList: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Tasks for selected day plus 'Setiap Hari'
  const dayTasks = tasks.filter(t => t.assignedDay === selectedDay || t.assignedDay === 'Setiap Hari');

  // Assigned Roommates on selected day
  const assignedRoommateIds = Array.from(new Set(dayTasks.map(t => t.assignedRoommateId)));
  const assignedRoommates = roommates.filter(r => assignedRoommateIds.includes(r.id));

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
          <Text style={styles.pageTitle}>Jadwal Mingguan 📅</Text>
          <Text style={styles.pageSub}>Pembagian tugas kebersihan harian untuk masing-masing anak kos.</Text>
        </View>

        {/* Auto Rotate Banner Button */}
        <View style={styles.rotateCard}>
          <View style={styles.rotateTextCol}>
            <Text style={styles.rotateTitle}>Rotasi Piket Otomatis ⚡</Text>
            <Text style={styles.rotateSub}>
              Acak tugas secara adil di antara semua penghuni kos setiap minggunya.
            </Text>
          </View>

          <Pressable 
            onPress={rotateWeeklySchedule}
            style={({ pressed }) => [styles.rotateBtn, pressed && styles.pressed]}
          >
            <Ionicons name="shuffle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.rotateBtnText}>Acak Jadwal</Text>
          </Pressable>
        </View>

        {/* Days Selector Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScrollView}>
          {daysList.map(d => {
            const count = tasks.filter(t => t.assignedDay === d || t.assignedDay === 'Setiap Hari').length;
            const isSelected = selectedDay === d;

            return (
              <Pressable
                key={d}
                onPress={() => setSelectedDay(d)}
                style={[styles.dayCard, isSelected && styles.dayCardActive]}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>{d}</Text>
                <View style={[styles.dayCountBadge, isSelected && styles.dayCountBadgeActive]}>
                  <Text style={[styles.dayCountText, isSelected && styles.dayCountTextActive]}>
                    {count} Tugas
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected Day Summary Banner */}
        <View style={styles.dayBanner}>
          <View style={styles.dayBannerLeft}>
            <View style={styles.dayIconBox}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.dayBannerTitle}>Piket Hari {selectedDay}</Text>
              <Text style={styles.dayBannerSub}>
                {assignedRoommates.length > 0 
                  ? `Petugas: ${assignedRoommates.map(r => r.name).join(', ')}`
                  : 'Belum ada petugas yang ditugaskan.'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tasks List */}
        {dayTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="sparkles-outline" size={42} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Libur Piket Hari {selectedDay}!</Text>
            <Text style={styles.emptySub}>Tidak ada tugas khusus yang dijadwalkan untuk hari ini.</Text>
          </View>
        ) : (
          dayTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Add Button */}
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
  rotateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  rotateTextCol: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  rotateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  rotateSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rotateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  rotateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
  daysScrollView: {
    marginBottom: SPACING.md,
  },
  dayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    minWidth: 85,
    ...SHADOWS.small,
  },
  dayCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  dayNameActive: {
    color: '#FFFFFF',
  },
  dayCountBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  dayCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dayCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dayCountTextActive: {
    color: '#FFFFFF',
  },
  dayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  dayBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  dayBannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
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
