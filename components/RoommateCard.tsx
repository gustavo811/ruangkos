import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Roommate } from '../types';
import { useAuth } from '../context/AuthContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface RoommateCardProps {
  roommate: Roommate;
  rank?: number;
  onDelete?: (id: string) => void;
}

export const RoommateCard: React.FC<RoommateCardProps> = ({ roommate, rank, onDelete }) => {
  const { user } = useAuth();
  const isMe = user?.name?.toLowerCase() === roommate.name.toLowerCase();

  const getRankBadge = (r?: number) => {
    if (r === 1) return { label: '🏆 #1 Master Kos', bg: '#FEF3C7', color: '#D97706' };
    if (r === 2) return { label: '🥈 #2 Rajin', bg: '#F1F5F9', color: '#475569' };
    if (r === 3) return { label: '🥉 #3 Telaten', bg: '#FFEDD5', color: '#C2410C' };
    return null;
  };

  const rankInfo = getRankBadge(rank);

  return (
    <View style={[styles.card, isMe && styles.cardMe]}>
      {/* Left Avatar */}
      <View style={[styles.avatarCircle, { backgroundColor: roommate.avatarColor }]}>
        <Text style={styles.avatarText}>{roommate.name[0]}</Text>
      </View>

      {/* Middle Content */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{roommate.name}</Text>
          {isMe && (
            <View style={styles.meBadge}>
              <Text style={styles.meText}>Kamu</Text>
            </View>
          )}
          {roommate.role === 'Ketua Kos' && (
            <View style={styles.leaderBadge}>
              <Text style={styles.leaderText}>Ketua</Text>
            </View>
          )}
        </View>

        <Text style={styles.subText}>
          {roommate.tasksCompletedCount} Tugas Selesai
        </Text>

        {rankInfo && (
          <View style={[styles.rankBadge, { backgroundColor: rankInfo.bg }]}>
            <Text style={[styles.rankText, { color: rankInfo.color }]}>
              {rankInfo.label}
            </Text>
          </View>
        )}
      </View>

      {/* Right Score */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreNumber}>{roommate.score}</Text>
        <Text style={styles.scoreLabel}>Poin</Text>
      </View>

      {onDelete && roommate.role !== 'Ketua Kos' && (
        <Pressable 
          onPress={() => onDelete(roommate.id)} 
          style={styles.deleteBtn}
          hitSlop={6}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  cardMe: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: '#FAF9FF',
  },
  meBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginRight: 6,
  },
  meText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 6,
  },
  leaderBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  leaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  rankBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '800',
  },
  scoreContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.surfaceMuted,
  },
  scoreNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 6,
  },
});
