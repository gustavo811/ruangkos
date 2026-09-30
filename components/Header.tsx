import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import { ProjectInfoModal } from './ProjectInfoModal';

export const Header: React.FC = () => {
  const { settings, triggerNotification, tasks } = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  // Quick action to test auto notification
  const handleTestNotification = () => {
    const pending = tasks.filter(t => !t.isCompleted);
    if (pending.length > 0) {
      const first = pending[0];
      triggerNotification(
        '🔔 Pengingat Kebersihan Kos!',
        `Jangan lupa tugas "${first.title}" (Jam ${first.time})`
      );
    } else {
      triggerNotification(
        '✨ Semua Kos Bersih!',
        'Luar biasa! Tidak ada tugas kebersihan yang tertunda hari ini.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <View style={styles.logoBadge}>
          <Ionicons name="sparkles" size={20} color="#FFFFFF" />
        </View>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.appName}>RuangKos</Text>
            <View style={styles.kelompokChip}>
              <Text style={styles.kelompokText}>K-21</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{settings.kosName || 'RuangKos Melati 21'}</Text>
        </View>
      </View>

      <View style={styles.rightRow}>
        <Pressable 
          onPress={handleTestNotification} 
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          <View style={styles.notificationDot} />
        </Pressable>

        <Pressable 
          onPress={() => setModalVisible(true)} 
          style={({ pressed }) => [styles.infoBtn, pressed && styles.pressed]}
        >
          <Ionicons name="information-circle-outline" size={22} color={COLORS.primary} />
        </Pressable>
      </View>

      <ProjectInfoModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 54, // Safe top spacing for mobile status bar
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  kelompokChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginLeft: 6,
  },
  kelompokText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  infoBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
