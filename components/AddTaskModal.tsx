import React, { useState } from 'react';
import { 
  Modal, StyleSheet, Text, View, Pressable, TextInput, ScrollView, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { TaskCategory, TaskPriority, DayOfWeek } from '../types';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ visible, onClose }) => {
  const { addTask, roommates } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('ruang_tamu');
  const [assignedRoommateId, setAssignedRoommateId] = useState(roommates[0]?.id || '');
  const [assignedDay, setAssignedDay] = useState<DayOfWeek>('Senin');
  const [time, setTime] = useState('07:30');
  const [priority, setPriority] = useState<TaskPriority>('Sedang');
  const [notes, setNotes] = useState('');

  const categories: { key: TaskCategory; label: string; icon: string }[] = [
    { key: 'ruang_tamu', label: 'Ruang Tamu', icon: 'home-outline' },
    { key: 'kamar_mandi', label: 'Kamar Mandi', icon: 'water-outline' },
    { key: 'dapur', label: 'Dapur', icon: 'restaurant-outline' },
    { key: 'sampah', label: 'Sampah', icon: 'trash-outline' },
    { key: 'halaman', label: 'Halaman', icon: 'leaf-outline' },
    { key: 'lainnya', label: 'Lainnya', icon: 'sparkles-outline' },
  ];

  const days: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu', 'Setiap Hari'];

  const priorities: TaskPriority[] = ['Tinggi', 'Sedang', 'Rendah'];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Form Belum Lengkap', 'Silahkan isi nama tugas kebersihan terlebih dahulu.');
      return;
    }

    await addTask({
      title: title.trim(),
      category,
      assignedRoommateId: assignedRoommateId || roommates[0]?.id || 'roommate-1',
      assignedDay,
      time: time.trim() || '08:00',
      priority,
      notes: notes.trim(),
    });

    // Reset Form
    setTitle('');
    setNotes('');
    onClose();
  };

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
            <Text style={styles.headerTitle}>➕ Tambah Tugas Kebersihan</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Task Title */}
            <Text style={styles.label}>Nama Tugas *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Menyapu & Mengepel Ruang Tamu"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Category Selector */}
            <Text style={styles.label}>Kategori Area</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScrollView}>
              {categories.map(cat => (
                <Pressable
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  style={[
                    styles.pillItem,
                    category === cat.key && styles.pillItemActive,
                  ]}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={14} 
                    color={category === cat.key ? '#FFFFFF' : COLORS.textSecondary} 
                    style={{ marginRight: 6 }}
                  />
                  <Text 
                    style={[
                      styles.pillText, 
                      category === cat.key && styles.pillTextActive
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Assign Roommate */}
            <Text style={styles.label}>Penanggung Jawab (Anak Kos)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScrollView}>
              {roommates.map(r => (
                <Pressable
                  key={r.id}
                  onPress={() => setAssignedRoommateId(r.id)}
                  style={[
                    styles.personPill,
                    assignedRoommateId === r.id && styles.personPillActive,
                  ]}
                >
                  <View style={[styles.miniAvatar, { backgroundColor: r.avatarColor }]}>
                    <Text style={styles.miniAvatarText}>{r.name[0]}</Text>
                  </View>
                  <Text 
                    style={[
                      styles.pillText,
                      assignedRoommateId === r.id && styles.pillTextActive
                    ]}
                  >
                    {r.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Day Selector */}
            <Text style={styles.label}>Hari Piket</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScrollView}>
              {days.map(d => (
                <Pressable
                  key={d}
                  onPress={() => setAssignedDay(d)}
                  style={[
                    styles.pillItem,
                    assignedDay === d && styles.pillItemActive,
                  ]}
                >
                  <Text 
                    style={[
                      styles.pillText,
                      assignedDay === d && styles.pillTextActive
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Time & Priority Row */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Jam (WIB)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="07:30"
                  placeholderTextColor={COLORS.textMuted}
                  value={time}
                  onChangeText={setTime}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Prioritas</Text>
                <View style={styles.priorityRow}>
                  {priorities.map(p => (
                    <Pressable
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[
                        styles.priorityBtn,
                        priority === p && styles.priorityBtnActive,
                      ]}
                    >
                      <Text 
                        style={[
                          styles.priorityBtnText,
                          priority === p && styles.priorityBtnTextActive
                        ]}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Notes */}
            <Text style={styles.label}>Catatan Tambahan (Opsional)</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Contoh: Guanakan pembersih rasa lavender..."
              placeholderTextColor={COLORS.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <View style={{ height: 20 }} />
          </ScrollView>

          <Pressable onPress={handleSubmit} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Simpan Jadwal Tugas</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

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
    maxHeight: '90%',
    padding: SPACING.lg,
    ...SHADOWS.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    marginVertical: SPACING.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  pillScrollView: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginRight: 8,
  },
  pillItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  personPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: 8,
  },
  personPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  miniAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 2,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  priorityBtnActive: {
    backgroundColor: COLORS.primary,
  },
  priorityBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  priorityBtnTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
