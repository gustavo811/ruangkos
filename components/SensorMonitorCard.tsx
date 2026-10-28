import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSensor, MotionStatus } from '../context/SensorContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

export const SensorMonitorCard: React.FC = () => {
  const router = useRouter();
  const {
    data,
    magnitude,
    motionStatus,
    isShaking,
    shakeCount,
    vibrationActive,
    isSensorAvailable,
    triggerManualShake,
  } = useSensor();

  // Helper for status badge colors and icons
  const getStatusStyle = (status: MotionStatus) => {
    switch (status) {
      case 'Goyangan Terdeteksi!':
        return {
          bg: '#FEE2E2',
          border: '#EF4444',
          text: '#DC2626',
          icon: 'flash' as const,
        };
      case 'Gerakan Kuat':
        return {
          bg: '#FFEDD5',
          border: '#F97316',
          text: '#C2410C',
          icon: 'bicycle' as const,
        };
      case 'Gerakan Ringan':
        return {
          bg: '#FEF9C3',
          border: '#FACC15',
          text: '#854D0E',
          icon: 'walk' as const,
        };
      case 'Miring Kiri':
      case 'Miring Kanan':
      case 'Menghadap Atas':
      case 'Menghadap Bawah':
        return {
          bg: '#E0E7FF',
          border: '#6366F1',
          text: '#4338CA',
          icon: 'phone-portrait' as const,
        };
      case 'Diam / Stabil':
      default:
        return {
          bg: '#DCFCE7',
          border: '#22C55E',
          text: '#15803D',
          icon: 'shield-checkmark' as const,
        };
    }
  };

  const statusStyle = getStatusStyle(motionStatus);

  // Normalize axis value to percentage bar [-2g to +2g] -> 0% to 100%
  const getBarPercent = (val: number) => {
    const clamped = Math.max(-2, Math.min(2, val));
    return ((clamped + 2) / 4) * 100;
  };

  // 2D Spirit Level Bubble coordinates clamped to [-32, 32] px
  const bubbleX = Math.max(-32, Math.min(32, -data.x * 32));
  const bubbleY = Math.max(-32, Math.min(32, data.y * 32));

  return (
    <View style={[styles.card, isShaking && styles.cardShaking]}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.sensorIconBadge, isShaking && styles.iconBadgeShake]}>
            <Ionicons
              name={isShaking ? 'radio' : 'speedometer-outline'}
              size={20}
              color={isShaking ? '#DC2626' : COLORS.primary}
            />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.cardTitle}>Sensor Gerak API</Text>
              <View style={[styles.hardwareTag, { backgroundColor: isSensorAvailable ? '#ECFDF5' : '#FFFBEB' }]}>
                <Text style={[styles.hardwareTagText, { color: isSensorAvailable ? COLORS.secondary : COLORS.warning }]}>
                  {isSensorAvailable ? 'Hardware' : 'Web/Sim'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSub}>Akselerometer 3-Axis Real-Time</Text>
          </View>
        </View>

        {/* Shake Count Badge */}
        <View style={styles.shakeCounterBadge}>
          <Ionicons name="flame" size={14} color="#EF4444" />
          <Text style={styles.shakeCounterText}>{shakeCount}x Goyang</Text>
        </View>
      </View>

      {/* Prominent Vibration & Shake Alert Notification Banner */}
      {(isShaking || vibrationActive) && (
        <View style={styles.vibrationAlertBanner}>
          <View style={styles.vibrationPulseDot} />
          <Ionicons name="notifications" size={16} color="#DC2626" style={{ marginRight: 6 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.vibrationAlertTitle}>📳 NOTIFIKASI GETARAN AKTIF</Text>
            <Text style={styles.vibrationAlertDesc}>Goyangan perangkat terdeteksi secara real-time!</Text>
          </View>
        </View>
      )}

      {/* Real-time Status Pill */}
      <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={statusStyle.icon} size={18} color={statusStyle.text} style={{ marginRight: 8 }} />
          <View>
            <Text style={styles.statusLabel}>STATUS GERAKAN:</Text>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{motionStatus}</Text>
          </View>
        </View>
        <View style={styles.magnitudePill}>
          <Text style={styles.magnitudeLabel}>G-Force</Text>
          <Text style={styles.magnitudeValue}>{magnitude.toFixed(2)} g</Text>
        </View>
      </View>

      {/* 3-Axis X, Y, Z Live Display + 2D Spirit Level */}
      <View style={styles.metricsContainer}>
        {/* Axis Columns */}
        <View style={styles.axisList}>
          {/* X Axis */}
          <View style={styles.axisRow}>
            <View style={styles.axisLabelBox}>
              <Text style={[styles.axisLetter, { color: '#2563EB' }]}>X</Text>
              <Text style={styles.axisSubText}>Lateral</Text>
            </View>
            <View style={styles.axisBarContainer}>
              <View style={styles.axisBarBg}>
                <View
                  style={[
                    styles.axisBarFill,
                    {
                      width: `${getBarPercent(data.x)}%`,
                      backgroundColor: '#2563EB',
                    },
                  ]}
                />
                <View style={styles.axisCenterMark} />
              </View>
            </View>
            <Text style={[styles.axisValue, { color: '#2563EB' }]}>
              {data.x >= 0 ? `+${data.x.toFixed(2)}` : data.x.toFixed(2)} g
            </Text>
          </View>

          {/* Y Axis */}
          <View style={styles.axisRow}>
            <View style={styles.axisLabelBox}>
              <Text style={[styles.axisLetter, { color: '#059669' }]}>Y</Text>
              <Text style={styles.axisSubText}>Vertikal</Text>
            </View>
            <View style={styles.axisBarContainer}>
              <View style={styles.axisBarBg}>
                <View
                  style={[
                    styles.axisBarFill,
                    {
                      width: `${getBarPercent(data.y)}%`,
                      backgroundColor: '#059669',
                    },
                  ]}
                />
                <View style={styles.axisCenterMark} />
              </View>
            </View>
            <Text style={[styles.axisValue, { color: '#059669' }]}>
              {data.y >= 0 ? `+${data.y.toFixed(2)}` : data.y.toFixed(2)} g
            </Text>
          </View>

          {/* Z Axis */}
          <View style={styles.axisRow}>
            <View style={styles.axisLabelBox}>
              <Text style={[styles.axisLetter, { color: '#7C3AED' }]}>Z</Text>
              <Text style={styles.axisSubText}>Gravitasi</Text>
            </View>
            <View style={styles.axisBarContainer}>
              <View style={styles.axisBarBg}>
                <View
                  style={[
                    styles.axisBarFill,
                    {
                      width: `${getBarPercent(data.z)}%`,
                      backgroundColor: '#7C3AED',
                    },
                  ]}
                />
                <View style={styles.axisCenterMark} />
              </View>
            </View>
            <Text style={[styles.axisValue, { color: '#7C3AED' }]}>
              {data.z >= 0 ? `+${data.z.toFixed(2)}` : data.z.toFixed(2)} g
            </Text>
          </View>
        </View>

        {/* 2D Spirit Level (Waterpas Visualizer) */}
        <View style={styles.spiritLevelWrapper}>
          <View style={[styles.spiritLevelTarget, isShaking && styles.spiritLevelTargetShake]}>
            <View style={styles.spiritCrossH} />
            <View style={styles.spiritCrossV} />
            <View style={styles.spiritCenterRing} />
            {/* Moving Bubble */}
            <View
              style={[
                styles.spiritBubble,
                {
                  transform: [{ translateX: bubbleX }, { translateY: bubbleY }],
                  backgroundColor: isShaking ? '#EF4444' : COLORS.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.spiritLabel}>Waterpas 2D</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActionsRow}>
        <Pressable
          onPress={triggerManualShake}
          style={({ pressed }) => [
            styles.shakeTestBtn,
            pressed && styles.btnPressed,
          ]}
        >
          <Ionicons name="flash-outline" size={16} color="#DC2626" />
          <Text style={styles.shakeTestBtnText}>Simulasi Goyang</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(tabs)/sensor' as any)}
          style={({ pressed }) => [
            styles.openDetailsBtn,
            pressed && styles.btnPressed,
          ]}
        >
          <Text style={styles.openDetailsBtnText}>Monitor Lengkap</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
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
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.medium,
  },
  cardShaking: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 4,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sensorIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 2,
  },
  iconBadgeShake: {
    backgroundColor: '#FEE2E2',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 6,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  hardwareTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  hardwareTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  shakeCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  shakeCounterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 3,
  },
  vibrationAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: RADIUS.md,
    padding: 8,
    marginBottom: SPACING.sm + 2,
  },
  vibrationPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    marginRight: 6,
  },
  vibrationAlertTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
  },
  vibrationAlertDesc: {
    fontSize: 10,
    color: '#B91C1C',
    fontWeight: '500',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  magnitudePill: {
    alignItems: 'flex-end',
  },
  magnitudeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  magnitudeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: 12,
  },
  axisList: {
    flex: 1,
    gap: 8,
  },
  axisRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  axisLabelBox: {
    width: 44,
  },
  axisLetter: {
    fontSize: 12,
    fontWeight: '800',
  },
  axisSubText: {
    fontSize: 8,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  axisBarContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  axisBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  axisBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  axisCenterMark: {
    position: 'absolute',
    left: '50%',
    width: 1.5,
    height: '100%',
    backgroundColor: '#94A3B8',
  },
  axisValue: {
    width: 58,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  spiritLevelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spiritLevelTarget: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  spiritLevelTargetShake: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  spiritCrossH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  spiritCrossV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  spiritCenterRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
  },
  spiritBubble: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  spiritLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shakeTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  shakeTestBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  openDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    gap: 6,
    ...SHADOWS.small,
  },
  openDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
