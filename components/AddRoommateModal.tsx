import React, { useState } from 'react';
import { 
  Modal, StyleSheet, Text, View, Pressable, TextInput, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

interface AddRoommateModalProps {
  visible: boolean;
  onClose: () => void;
}

const AVATAR_COLORS = [
  '#6C5CE7', '#00B894', '#FF7675', '#0984E3', 
  '#FDCB6E', '#E84393', '#6C5CE7', '#00CEC9'
];

export const AddRoommateModal: React.FC<AddRoommateModalProps> = ({ visible, onClose }) => {
  const { addRoommate } = useApp();

  const [name, setName] = useState('');
  const [role, setRole] = useState<'Penghuni' | 'Ketua Kos'>('Penghuni');
  const [phone, setPhone] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Form Belum Lengkap', 'Silahkan masukkan nama penghuni kos.');
      return;
    }

    await addRoommate({
      name: name.trim(),
      role,
      phone: phone.trim(),
      avatarColor,
    });

    setName('');
    setPhone('');
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
            <Text style={styles.headerTitle}>👤 Tambah Penghuni Kos</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.body}>
            {/* Name */}
            <Text style={styles.label}>Nama Lengkap *</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Rian Hidayat"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Role */}
            <Text style={styles.label}>Peran Penghuni</Text>
            <View style={styles.roleContainer}>
              <Pressable
                onPress={() => setRole('Penghuni')}
                style={[styles.roleBtn, role === 'Penghuni' && styles.roleBtnActive]}
              >
                <Text style={[styles.roleText, role === 'Penghuni' && styles.roleTextActive]}>
                  Penghuni
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setRole('Ketua Kos')}
                style={[styles.roleBtn, role === 'Ketua Kos' && styles.roleBtnActive]}
              >
                <Text style={[styles.roleText, role === 'Ketua Kos' && styles.roleTextActive]}>
                  Ketua Kos
                </Text>
              </Pressable>
            </View>

            {/* Phone */}
            <Text style={styles.label}>No. WhatsApp / Telepon (Opsional)</Text>
            <TextInput
              style={styles.input}
              placeholder="08123456789"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            {/* Avatar Color */}
            <Text style={styles.label}>Pilih Warna Badge Avatar</Text>
            <View style={styles.colorsRow}>
              {AVATAR_COLORS.map((c, i) => (
                <Pressable
                  key={i}
                  onPress={() => setAvatarColor(c)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    avatarColor === c && styles.colorCircleActive,
                  ]}
                >
                  {avatarColor === c && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable onPress={handleSubmit} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Tambah Penghuni</Text>
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
    marginBottom: SPACING.md,
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
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 2,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  roleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...SHADOWS.small,
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
