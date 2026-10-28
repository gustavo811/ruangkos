import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { useSensor, SensitivityLevel, ShakeAction, MotionStatus } from '../../context/SensorContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export default function SensorScreen() {
  const {
    data,
    magnitude,
    delta,
    motionStatus,
    isShaking,
    shakeCount,
    lastShakeTime,
    vibrationActive,
    vibrateOnShake,
    setVibrateOnShake,
    inAppNotificationOnShake,
    setInAppNotificationOnShake,
    isSensorAvailable,
    isActive,
    toggleSensor,
    updateInterval,
    setUpdateIntervalMs,
    sensitivity,
    setSensitivity,
    shakeAction,
    setShakeAction,
    motionLogs,
    clearLogs,
    resetShakeCount,
    simulateMotion,
    triggerManualShake,
  } = useSensor();

  // Status Styling
  const getStatusColor = (status: MotionStatus) => {
    switch (status) {
      case 'Goyangan Terdeteksi!':
        return { bg: '#FEF2F2', border: '#EF4444', text: '#DC2626', icon: 'flash' as const };
      case 'Gerakan Kuat':
        return { bg: '#FFEDD5', border: '#F97316', text: '#C2410C', icon: 'bicycle' as const };
      case 'Gerakan Ringan':
        return { bg: '#FEF9C3', border: '#FACC15', text: '#854D0E', icon: 'walk' as const };
      case 'Miring Kiri':
      case 'Miring Kanan':
      case 'Menghadap Atas':
      case 'Menghadap Bawah':
        return { bg: '#E0E7FF', border: '#6366F1', text: '#4338CA', icon: 'phone-portrait' as const };
      case 'Diam / Stabil':
      default:
        return { bg: '#DCFCE7', border: '#22C55E', text: '#15803D', icon: 'shield-checkmark' as const };
    }
  };

  const statusStyle = getStatusColor(motionStatus);

  // Normalization for visual bar [-2g, +2g] -> [0%, 100%]
  const getBarWidth = (val: number) => {
    const clamped = Math.max(-2, Math.min(2, val));
    return ((clamped + 2) / 4) * 100;
  };

  // Waterpas bubble coordinate calculation [-45, 45] px
  const bubbleX = Math.max(-45, Math.min(45, -data.x * 45));
  const bubbleY = Math.max(-45, Math.min(45, data.y * 45));

  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Header Info */}
        <View style={styles.headerHero}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="hardware-chip" size={20} color={COLORS.primary} />
              <Text style={styles.heroTitle}>Akselerometer Sensor API</Text>
            </View>
            <Text style={styles.heroSub}>
              Deteksi gerakan 3-Axis & Notifikasi getaran secara real-time
            </Text>
          </View>

          {/* Toggle Sensor Power */}
          <View style={styles.powerToggleContainer}>
            <Text style={styles.powerToggleText}>{isActive ? 'AKTIF' : 'NONAKTIF'}</Text>
            <Switch
              value={isActive}
              onValueChange={toggleSensor}
              trackColor={{ false: '#CBD5E1', true: COLORS.primaryLight }}
              thumbColor={isActive ? COLORS.primary : '#94A3B8'}
            />
          </View>
        </View>

        {/* Hardware Status Tag */}
        <View style={[styles.sensorStatusNotice, { backgroundColor: isSensorAvailable ? '#ECFDF5' : '#FFFBEB' }]}>
          <Ionicons
            name={isSensorAvailable ? 'checkmark-circle' : 'information-circle'}
            size={18}
            color={isSensorAvailable ? COLORS.secondary : COLORS.warning}
          />
          <Text style={[styles.sensorStatusNoticeText, { color: isSensorAvailable ? '#065F46' : '#92400E' }]}>
            {isSensorAvailable
              ? 'Sensor Akselerometer Perangkat Terhubung & Siap Membaca Gerakan Fisik.'
              : 'Sensor berjalan dalam mode Universal / Web. Gunakan tombol simulasi di bawah untuk pengujian.'}
          </Text>
        </View>

        {/* PROMINENT VIBRATION & SHAKE NOTIFICATION ALERT */}
        {(isShaking || vibrationActive) && (
          <View style={styles.vibrationAlertBanner}>
            <View style={styles.vibrationPulseIndicator}>
              <Ionicons name="notifications" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.vibrationAlertHeading}>📳 NOTIFIKASI GETARAN AKTIF!</Text>
                <View style={styles.liveVibeBadge}>
                  <Text style={styles.liveVibeBadgeText}>LIVE</Text>
                </View>
              </View>
              <Text style={styles.vibrationAlertMessage}>
                Goyangan perangkat terdeteksi! Sistem memicu getaran haptik dan memperbarui status UI.
              </Text>
            </View>
          </View>
        )}

        {/* REAL-TIME STATUS UI CARD */}
        <View style={[styles.statusHeroCard, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
          <View style={styles.statusHeroTop}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusHeroIconBox, { backgroundColor: statusStyle.border }]}>
                <Ionicons name={statusStyle.icon} size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.statusHeroLabel}>STATUS GERAKAN TERDETEKSI</Text>
                <Text style={[styles.statusHeroValue, { color: statusStyle.text }]}>{motionStatus}</Text>
              </View>
            </View>

            <View style={styles.shakeCounterHero}>
              <Ionicons name="flame" size={16} color="#DC2626" />
              <Text style={styles.shakeCounterHeroText}>{shakeCount}x</Text>
            </View>
          </View>

          <View style={styles.statusHeroDivider} />

          {/* Quick Metrics Bar */}
          <View style={styles.statusHeroStats}>
            <View style={styles.statusStatCol}>
              <Text style={styles.statColLabel}>G-FORCE (TOTAL)</Text>
              <Text style={styles.statColVal}>{magnitude.toFixed(2)} g</Text>
            </View>

            <View style={styles.statColDivider} />

            <View style={styles.statusStatCol}>
              <Text style={styles.statColLabel}>LAJU PERUBAHAN (Δ)</Text>
              <Text style={styles.statColVal}>{delta.toFixed(2)}</Text>
            </View>

            <View style={styles.statColDivider} />

            <View style={styles.statusStatCol}>
              <Text style={styles.statColLabel}>TERAKHIR GOYANG</Text>
              <Text style={styles.statColVal}>{lastShakeTime || '-'}</Text>
            </View>
          </View>
        </View>

        {/* 3-AXIS REAL-TIME READINGS (X, Y, Z) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="analytics" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Nilai Sumbu X, Y, Z Real-Time</Text>
            </View>
            <Text style={styles.unitBadge}>Satuan: g (9.81 m/s²)</Text>
          </View>

          {/* Sumbu X */}
          <View style={styles.axisDisplayCard}>
            <View style={styles.axisHeader}>
              <View style={[styles.axisBadge, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.axisBadgeText, { color: '#1D4ED8' }]}>X</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.axisName}>Sumbu X (Lateral / Miring Kiri-Kanan)</Text>
                <Text style={styles.axisExplain}>Nilai positif jika miring ke kanan, negatif ke kiri</Text>
              </View>
              <Text style={[styles.axisNumeric, { color: '#1D4ED8' }]}>
                {data.x >= 0 ? `+${data.x.toFixed(3)}` : data.x.toFixed(3)} g
              </Text>
            </View>

            <View style={styles.axisMeterWrapper}>
              <View style={styles.axisMeterBg}>
                <View style={[styles.axisMeterFill, { width: `${getBarWidth(data.x)}%`, backgroundColor: '#2563EB' }]} />
                <View style={styles.axisMeterCenter} />
              </View>
              <View style={styles.axisMeterLegend}>
                <Text style={styles.legendText}>-2.0g (Kiri)</Text>
                <Text style={styles.legendText}>0.0g</Text>
                <Text style={styles.legendText}>+2.0g (Kanan)</Text>
              </View>
            </View>
          </View>

          {/* Sumbu Y */}
          <View style={styles.axisDisplayCard}>
            <View style={styles.axisHeader}>
              <View style={[styles.axisBadge, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.axisBadgeText, { color: '#047857' }]}>Y</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.axisName}>Sumbu Y (Longitudinal / Miring Atas-Bawah)</Text>
                <Text style={styles.axisExplain}>Nilai positif jika miring ke bawah, negatif ke atas</Text>
              </View>
              <Text style={[styles.axisNumeric, { color: '#047857' }]}>
                {data.y >= 0 ? `+${data.y.toFixed(3)}` : data.y.toFixed(3)} g
              </Text>
            </View>

            <View style={styles.axisMeterWrapper}>
              <View style={styles.axisMeterBg}>
                <View style={[styles.axisMeterFill, { width: `${getBarWidth(data.y)}%`, backgroundColor: '#059669' }]} />
                <View style={styles.axisMeterCenter} />
              </View>
              <View style={styles.axisMeterLegend}>
                <Text style={styles.legendText}>-2.0g (Atas)</Text>
                <Text style={styles.legendText}>0.0g</Text>
                <Text style={styles.legendText}>+2.0g (Bawah)</Text>
              </View>
            </View>
          </View>

          {/* Sumbu Z */}
          <View style={styles.axisDisplayCard}>
            <View style={styles.axisHeader}>
              <View style={[styles.axisBadge, { backgroundColor: '#EDE9FE' }]}>
                <Text style={[styles.axisBadgeText, { color: '#6D28D9' }]}>Z</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.axisName}>Sumbu Z (Vertikal / Gravitasi Bumi)</Text>
                <Text style={styles.axisExplain}>Nilai ~1.0g saat HP telentang menghadap atas</Text>
              </View>
              <Text style={[styles.axisNumeric, { color: '#6D28D9' }]}>
                {data.z >= 0 ? `+${data.z.toFixed(3)}` : data.z.toFixed(3)} g
              </Text>
            </View>

            <View style={styles.axisMeterWrapper}>
              <View style={styles.axisMeterBg}>
                <View style={[styles.axisMeterFill, { width: `${getBarWidth(data.z)}%`, backgroundColor: '#7C3AED' }]} />
                <View style={styles.axisMeterCenter} />
              </View>
              <View style={styles.axisMeterLegend}>
                <Text style={styles.legendText}>-2.0g (Telungkup)</Text>
                <Text style={styles.legendText}>0.0g</Text>
                <Text style={styles.legendText}>+2.0g (Telentang)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2D SPIRIT LEVEL (WATERPAS VISUALIZER) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="compass" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Visualisasi Kemiringan (Waterpas 2D)</Text>
            </View>
          </View>

          <View style={styles.spiritCenterContainer}>
            <View style={[styles.spiritTargetBig, isShaking && styles.spiritTargetShake]}>
              <View style={styles.crosshairH} />
              <View style={styles.crosshairV} />
              <View style={styles.spiritRingOuter} />
              <View style={styles.spiritRingInner} />

              {/* Dynamic Bubble Indicator */}
              <View
                style={[
                  styles.spiritFloatingBubble,
                  {
                    transform: [{ translateX: bubbleX }, { translateY: bubbleY }],
                    backgroundColor: isShaking ? '#EF4444' : COLORS.primary,
                  },
                ]}
              >
                <View style={styles.spiritBubbleGlint} />
              </View>
            </View>

            <View style={styles.spiritInfoBlock}>
              <Text style={styles.spiritTitle}>Orientasi Perangkat:</Text>
              <Text style={styles.spiritOrientationText}>
                {Math.abs(data.x) < 0.15 && Math.abs(data.y) < 0.15
                  ? '🎯 Rata / Seimbang Sempurna'
                  : motionStatus}
              </Text>
              <Text style={styles.spiritCoords}>
                Offset: X={data.x.toFixed(2)} | Y={data.y.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* SIMULATION & PLAYGROUND CONTROLS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="game-controller" size={18} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Simulasi & Pengujian Gerakan</Text>
            </View>
            <View style={styles.testChip}>
              <Text style={styles.testChipText}>Uji Coba Cepat</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
            Tekan tombol simulasi di bawah untuk menguji respons sensor, deteksi gerakan, dan notifikasi getaran secara instan.
          </Text>

          <View style={styles.simulationGrid}>
            <Pressable
              onPress={triggerManualShake}
              style={({ pressed }) => [styles.simBtnPrimary, pressed && styles.btnPressed]}
            >
              <Ionicons name="flash" size={18} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.simBtnPrimaryTitle}>💥 Simulasi Goyangan Kuat (Shake)</Text>
                <Text style={styles.simBtnPrimarySub}>Memicu getaran + notifikasi + status UI</Text>
              </View>
            </Pressable>

            <View style={styles.simRow}>
              <Pressable
                onPress={() => simulateMotion('tilt_left')}
                style={({ pressed }) => [styles.simBtnSecondary, pressed && styles.btnPressed]}
              >
                <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
                <Text style={styles.simBtnSecondaryText}>Miring Kiri</Text>
              </Pressable>

              <Pressable
                onPress={() => simulateMotion('tilt_right')}
                style={({ pressed }) => [styles.simBtnSecondary, pressed && styles.btnPressed]}
              >
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                <Text style={styles.simBtnSecondaryText}>Miring Kanan</Text>
              </Pressable>
            </View>

            <View style={styles.simRow}>
              <Pressable
                onPress={() => simulateMotion('face_up')}
                style={({ pressed }) => [styles.simBtnSecondary, pressed && styles.btnPressed]}
              >
                <Ionicons name="phone-portrait-outline" size={16} color={COLORS.primary} />
                <Text style={styles.simBtnSecondaryText}>Layar Telentang</Text>
              </Pressable>

              <Pressable
                onPress={() => simulateMotion('idle')}
                style={({ pressed }) => [styles.simBtnSecondary, pressed && styles.btnPressed]}
              >
                <Ionicons name="stop-circle-outline" size={16} color={COLORS.secondary} />
                <Text style={styles.simBtnSecondaryText}>Reset Diam</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* SETTINGS & CONFIGURATION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="options" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Pengaturan Sensor & Respon</Text>
            </View>
          </View>

          {/* Sensitivitas Goyangan */}
          <View style={styles.settingItem}>
            <Text style={styles.settingTitle}>Tingkat Sensitivitas Goyangan</Text>
            <Text style={styles.settingDesc}>Menentukan seberapa kuat goyangan untuk memicu notifikasi getaran</Text>
            <View style={styles.segmentedRow}>
              {(['Tinggi', 'Sedang', 'Rendah'] as SensitivityLevel[]).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => setSensitivity(level)}
                  style={[
                    styles.segmentBtn,
                    sensitivity === level && styles.segmentBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      sensitivity === level && styles.segmentBtnTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Refresh Rate Update Interval */}
          <View style={styles.settingItem}>
            <Text style={styles.settingTitle}>Interval Pembaruan Sensor</Text>
            <Text style={styles.settingDesc}>Kecepatan pembacaan data koordinat dari sensor API</Text>
            <View style={styles.segmentedRow}>
              {[
                { label: 'Cepat (16ms)', ms: 16 },
                { label: 'Normal (100ms)', ms: 100 },
                { label: 'Hemat (500ms)', ms: 500 },
              ].map((item) => (
                <Pressable
                  key={item.ms}
                  onPress={() => setUpdateIntervalMs(item.ms)}
                  style={[
                    styles.segmentBtn,
                    updateInterval === item.ms && styles.segmentBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBtnText,
                      updateInterval === item.ms && styles.segmentBtnTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Vibration Feedback Switch */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Notifikasi Getaran (Haptic Feedback)</Text>
              <Text style={styles.settingDesc}>Memicu getaran fisik motor perangkat saat goyangan terdeteksi</Text>
            </View>
            <Switch
              value={vibrateOnShake}
              onValueChange={setVibrateOnShake}
              trackColor={{ false: '#CBD5E1', true: COLORS.primaryLight }}
              thumbColor={vibrateOnShake ? COLORS.primary : '#94A3B8'}
            />
          </View>

          {/* In-App Toast Banner Switch */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Tampilkan Notifikasi Pop-up (In-App Banner)</Text>
              <Text style={styles.settingDesc}>Memunculkan banner notifikasi saat sensor mendeteksi goyangan</Text>
            </View>
            <Switch
              value={inAppNotificationOnShake}
              onValueChange={setInAppNotificationOnShake}
              trackColor={{ false: '#CBD5E1', true: COLORS.primaryLight }}
              thumbColor={inAppNotificationOnShake ? COLORS.primary : '#94A3B8'}
            />
          </View>

          {/* Shake Action on RuangKos */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.settingTitle}>Aksi Aplikasi Saat Goyangan Terdeteksi</Text>
            <Text style={styles.settingDesc}>Fitur interaktif RuangKos yang otomatis dijalankan saat HP digoyang</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {[
                { key: 'reminder', title: '🔔 Munculkan Pengingat Kebersihan Kos' },
                { key: 'rotate_schedule', title: '🔀 Acak Rotasi Jadwal Piket Mingguan' },
                { key: 'none', title: '📳 Hanya Getar & Tampilkan Status' },
              ].map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => setShakeAction(opt.key as ShakeAction)}
                  style={[
                    styles.radioOption,
                    shakeAction === opt.key && styles.radioOptionActive,
                  ]}
                >
                  <Ionicons
                    name={shakeAction === opt.key ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={shakeAction === opt.key ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.radioOptionText,
                      shakeAction === opt.key && styles.radioOptionTextActive,
                    ]}
                  >
                    {opt.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* MOTION DETECTION LOGS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="time" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Riwayat Deteksi Gerakan</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable onPress={resetShakeCount} style={styles.textActionBtn}>
                <Text style={styles.textActionBtnLabel}>Reset Hitungan</Text>
              </Pressable>
              <Pressable onPress={clearLogs} style={styles.textActionBtn}>
                <Text style={[styles.textActionBtnLabel, { color: COLORS.danger }]}>Hapus Log</Text>
              </Pressable>
            </View>
          </View>

          {motionLogs.length === 0 ? (
            <View style={styles.emptyLogs}>
              <Ionicons name="pulse-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyLogsText}>Belum ada gerakan goyangan tercatat.</Text>
              <Text style={styles.emptyLogsSub}>Goyang perangkat atau klik "Simulasi Goyangan Kuat" untuk mulai mencatat.</Text>
            </View>
          ) : (
            motionLogs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logIconCol}>
                  <Ionicons name="flash" size={16} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.logType}>{log.type}</Text>
                    <Text style={styles.logTime}>{log.time}</Text>
                  </View>
                  <Text style={styles.logCoords}>
                    G: {log.magnitude}g • X: {log.x} | Y: {log.y} | Z: {log.z}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* EDUCATIONAL INFO */}
        <View style={styles.infoCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Ionicons name="school" size={20} color={COLORS.primary} />
            <Text style={styles.infoTitle}>Tentang Sensor API & Akselerometer</Text>
          </View>
          <Text style={styles.infoText}>
            Akselerometer mengukur percepatan linear (gravitasi dan inersia gerak) pada 3 sumbu spasial dalam satuan g-force (1g = 9.81 m/s²). Deteksi goyangan (Shake Detection) bekerja dengan mendeteksi perubahan vektor kecepatan Delta = |dx| + |dy| + |dz| dan lonjakan magnitudo total √(x² + y² + z²), kemudian memicu notifikasi getaran melalui API Vibration & Haptics.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  headerHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  heroSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  powerToggleContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  powerToggleText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
  },
  sensorStatusNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  sensorStatusNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  vibrationAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: 12,
    ...SHADOWS.medium,
  },
  vibrationPulseIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibrationAlertHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveVibeBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  liveVibeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  vibrationAlertMessage: {
    fontSize: 11,
    color: '#FEE2E2',
    fontWeight: '500',
    marginTop: 2,
  },
  statusHeroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 2,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  statusHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusHeroIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  statusHeroValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  shakeCounterHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    ...SHADOWS.small,
  },
  shakeCounterHeroText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  statusHeroDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: SPACING.md,
  },
  statusHeroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statusStatCol: {
    alignItems: 'center',
    flex: 1,
  },
  statColDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  statColLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  statColVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  unitBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  axisDisplayCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  axisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  axisBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  axisBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  axisName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  axisExplain: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  axisNumeric: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  axisMeterWrapper: {
    marginTop: 2,
  },
  axisMeterBg: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  axisMeterFill: {
    height: '100%',
    borderRadius: 5,
  },
  axisMeterCenter: {
    position: 'absolute',
    left: '50%',
    width: 2,
    height: '100%',
    backgroundColor: '#475569',
  },
  axisMeterLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  legendText: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  spiritCenterContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  spiritTargetBig: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F8FAFC',
    borderWidth: 3,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  spiritTargetShake: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  crosshairH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  crosshairV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#CBD5E1',
  },
  spiritRingOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    position: 'absolute',
  },
  spiritRingInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#64748B',
    position: 'absolute',
  },
  spiritFloatingBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    position: 'absolute',
    ...SHADOWS.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spiritBubbleGlint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    position: 'absolute',
    top: 4,
    left: 4,
  },
  spiritInfoBlock: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  spiritTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  spiritOrientationText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  spiritCoords: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  testChip: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  testChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  simulationGrid: {
    gap: 10,
  },
  simBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 12,
    ...SHADOWS.small,
  },
  simBtnPrimaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  simBtnPrimarySub: {
    fontSize: 10,
    color: '#FEE2E2',
    fontWeight: '500',
    marginTop: 1,
  },
  simRow: {
    flexDirection: 'row',
    gap: 10,
  },
  simBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  simBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingItem: {
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  segmentBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentBtnTextActive: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  radioOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: COLORS.primary,
  },
  radioOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  radioOptionTextActive: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  textActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  textActionBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyLogs: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyLogsText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  emptyLogsSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: SPACING.lg,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  logIconCol: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logType: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  logTime: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  logCoords: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  infoText: {
    fontSize: 11,
    color: '#3730A3',
    lineHeight: 17,
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
