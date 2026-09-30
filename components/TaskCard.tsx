import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskCategory } from '../types';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const { toggleTaskComplete, deleteTask, roommates } = useApp();

  const assignedRoommate = roommates.find(r => r.id === task.assignedRoommateId);

  const getCategoryDetails = (cat: TaskCategory) => {
    switch (cat) {
      case 'kamar_mandi':
        return { name: 'Kamar Mandi', icon: 'water-outline', color: COLORS.catKamarMandi };
      case 'dapur':
        return { name: 'Dapur', icon: 'restaurant-outline', color: COLORS.catDapur };
      case 'ruang_tamu':
        return { name: 'Ruang Tamu', icon: 'home-outline', color: COLORS.catRuangTamu };
      case 'sampah':
        return { name: 'Sampah', icon: 'trash-outline', color: COLORS.catSampah };
      case 'halaman':
        return { name: 'Halaman', icon: 'leaf-outline', color: COLORS.catHalaman };
      default:
        return { name: 'Lainnya', icon: 'sparkles-outline', color: COLORS.catLainnya };
    }
  };

  const catDetails = getCategoryDetails(task.category);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Tinggi':
        return { bg: '#FEE2E2', text: COLORS.danger };
      case 'Sedang':
        return { bg: '#FEF3C7', text: COLORS.warning };
      default:
        return { bg: '#E0E7FF', text: COLORS.primary };
    }
  };

  const priorityStyle = getPriorityStyle(task.priority);

  return (
    <View style={[styles.container, task.isCompleted && styles.completedContainer]}>
      {/* Checkbox Button */}
      <Pressable 
        onPress={() => toggleTaskComplete(task.id)} 
        style={styles.checkTouchable}
        hitSlop={8}
      >
        <View style={[styles.checkbox, task.isCompleted && styles.checkboxActive]}>
          {task.isCompleted && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
      </Pressable>

      {/* Main Task Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          {/* Category Chip */}
          <View style={[styles.categoryChip, { backgroundColor: catDetails.color + '1A' }]}>
            <Ionicons name={catDetails.icon as any} size={12} color={catDetails.color} style={{ marginRight: 4 }} />
            <Text style={[styles.categoryText, { color: catDetails.color }]}>
              {catDetails.name}
            </Text>
          </View>

          {/* Priority Badge */}
          <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
            <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
              {task.priority}
            </Text>
          </View>
        </View>

        {/* Task Title */}
        <Text style={[styles.title, task.isCompleted && styles.completedTitle]}>
          {task.title}
        </Text>

        {/* Meta Info Row */}
        <View style={styles.metaRow}>
          {/* Assigned Person */}
          <View style={styles.personContainer}>
            <View style={[styles.avatarDot, { backgroundColor: assignedRoommate?.avatarColor || COLORS.primary }]}>
              <Text style={styles.avatarInitial}>
                {(assignedRoommate?.name || 'P')[0]}
              </Text>
            </View>
            <Text style={styles.personName} numberOfLines={1}>
              {assignedRoommate ? assignedRoommate.name : 'Penghuni'}
            </Text>
          </View>

          {/* Day & Time */}
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} style={{ marginRight: 3 }} />
            <Text style={styles.timeText}>
              {task.assignedDay} • {task.time}
            </Text>
          </View>
        </View>
      </View>

      {/* Delete / Actions */}
      <Pressable 
        onPress={() => deleteTask(task.id)} 
        style={styles.deleteBtn}
        hitSlop={6}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  completedContainer: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.75,
  },
  checkTouchable: {
    paddingRight: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  personName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 6,
  },
});
