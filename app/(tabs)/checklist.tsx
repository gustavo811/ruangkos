import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, Pressable, TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { TaskCard } from '../../components/TaskCard';
import { AddTaskModal } from '../../components/AddTaskModal';
import { useApp } from '../../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';
import { TaskCategory } from '../../types';

export default function ChecklistScreen() {
  const { tasks } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'pending' | 'completed'>('semua');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'semua'>('semua');

  const categories: { key: TaskCategory | 'semua'; label: string; icon: string }[] = [
    { key: 'semua', label: 'Semua Area', icon: 'apps-outline' },
    { key: 'kamar_mandi', label: 'Kamar Mandi', icon: 'water-outline' },
    { key: 'dapur', label: 'Dapur', icon: 'restaurant-outline' },
    { key: 'ruang_tamu', label: 'Ruang Tamu', icon: 'home-outline' },
    { key: 'sampah', label: 'Sampah', icon: 'trash-outline' },
    { key: 'halaman', label: 'Halaman', icon: 'leaf-outline' },
  ];

  // Filter Tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'semua' ? true :
                          statusFilter === 'completed' ? t.isCompleted : !t.isCompleted;

    const matchesCategory = categoryFilter === 'semua' ? true : t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const completedCount = filteredTasks.filter(t => t.isCompleted).length;
  const totalCount = filteredTasks.length;

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
          <Text style={styles.pageTitle}>Checklist Kebersihan 🧹</Text>
          <Text style={styles.pageSub}>Tandai tugas yang sudah selesai dikerjakan anak kos.</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari tugas kebersihan..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.statusTabsRow}>
          <Pressable
            onPress={() => setStatusFilter('semua')}
            style={[styles.statusTab, statusFilter === 'semua' && styles.statusTabActive]}
          >
            <Text style={[styles.statusTabText, statusFilter === 'semua' && styles.statusTabTextActive]}>
              Semua ({tasks.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setStatusFilter('pending')}
            style={[styles.statusTab, statusFilter === 'pending' && styles.statusTabActive]}
          >
            <Text style={[styles.statusTabText, statusFilter === 'pending' && styles.statusTabTextActive]}>
              Belum Selesai ({tasks.filter(t => !t.isCompleted).length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setStatusFilter('completed')}
            style={[styles.statusTab, statusFilter === 'completed' && styles.statusTabActive]}
          >
            <Text style={[styles.statusTabText, statusFilter === 'completed' && styles.statusTabTextActive]}>
              Selesai ({tasks.filter(t => t.isCompleted).length})
            </Text>
          </Pressable>
        </View>

        {/* Category Horizontal Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScrollView}>
          {categories.map(cat => (
            <Pressable
              key={cat.key}
              onPress={() => setCategoryFilter(cat.key)}
              style={[
                styles.catPill,
                categoryFilter === cat.key && styles.catPillActive,
              ]}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={14} 
                color={categoryFilter === cat.key ? '#FFFFFF' : COLORS.textSecondary} 
                style={{ marginRight: 6 }}
              />
              <Text 
                style={[
                  styles.catPillText, 
                  categoryFilter === cat.key && styles.catPillTextActive
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Counter Summary */}
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            Menampilkan <Text style={styles.summaryHighlight}>{totalCount}</Text> Tugas ({completedCount} Selesai)
          </Text>
        </View>

        {/* Task Cards List */}
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Tidak Ada Tugas Ditemukan</Text>
            <Text style={styles.emptySub}>Coba ganti filter kata kunci atau kata pencarian Anda.</Text>
          </View>
        ) : (
          filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        )}

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  statusTabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  statusTabActive: {
    backgroundColor: COLORS.primary,
  },
  statusTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusTabTextActive: {
    color: '#FFFFFF',
  },
  catScrollView: {
    marginBottom: SPACING.md,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: 8,
  },
  catPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  summaryBar: {
    marginBottom: SPACING.md,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryHighlight: {
    fontWeight: '800',
    color: COLORS.primary,
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
    marginTop: 12,
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
