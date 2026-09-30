import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

export const CleanlinessProgressCard: React.FC<{ onAddTask?: () => void }> = ({ onAddTask }) => {
  const { cleanlinessScore, tasks } = useApp();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;

  const getStatusText = (score: number) => {
    if (score >= 80) return { title: 'Kos Super Bersih! ✨', color: COLORS.secondary, bg: '#ECFDF5' };
    if (score >= 50) return { title: 'Kos Cukup Rapi! 👍', color: COLORS.warning, bg: '#FFFBEB' };
    return { title: 'Perlu Kerja Bakti! 🧹', color: COLORS.danger, bg: '#FEF2F2' };
  };

  const status = getStatusText(cleanlinessScore);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={styles.greeting}>Halo, Anak Kos! 🏠</Text>
          <Text style={styles.cardTitle}>{status.title}</Text>
          <Text style={styles.cardSub}>
            {pendingTasks === 0
              ? 'Hebat! Semua tugas kebersihan telah selesai.'
              : `${pendingTasks} tugas kebersihan menunggu hari ini.`}
          </Text>
        </View>

        {/* Circular Score Display */}
        <View style={[styles.scoreBadge, { borderColor: status.color }]}>
          <Text style={[styles.scoreValue, { color: status.color }]}>{cleanlinessScore}%</Text>
          <Text style={styles.scoreLabel}>Bersih</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${cleanlinessScore}%`, backgroundColor: status.color }
          ]} 
        />
      </View>

      {/* Footer Info */}
      <View style={styles.footerRow}>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.statText}>{completedTasks} Selesai</Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color={COLORS.warning} />
          <Text style={styles.statText}>{pendingTasks} Tertunda</Text>
        </View>

        {onAddTask && (
          <Pressable onPress={onAddTask} style={styles.addQuickBtn}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addQuickText}>Tugas Baru</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.medium,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  scoreBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: -2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  addQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  addQuickText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
  },
});
