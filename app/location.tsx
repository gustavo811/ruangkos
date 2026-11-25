import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLocationTracking } from '../context/LocationContext';
import { LocationMapView } from '../components/LocationMapView';
import { POWER_PROFILES } from '../services/locationService';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';
import { PowerMode } from '../types';

const BATTERY_OPTIMIZATION_TIPS = [
  {
    icon: 'speedometer-outline',
    title: '1. Pemilihan Tingkat Akurasi (Accuracy Tiering)',
    desc: 'Menggunakan Location.Accuracy.Balanced (~100m, Wi-Fi/Cell) untuk pelacakan harian dibanding Accuracy.High agar chip GPS tidak terus aktif penuh.',
  },
  {
    icon: 'resize-outline',
    title: '2. Pembatasan Jarak & Waktu (Interval Throttling)',
    desc: 'Mengatur distanceInterval (25m–100m) dan timeInterval (10–30 detik) pada watchPositionAsync sehingga callback tidak dipanggil terus-menerus saat pengguna diam.',
  },
  {
    icon: 'leaf-outline',
    title: '3. Caching Reverse Geocoding (> 30m)',
    desc: 'Hasil reverseGeocodeAsync disimpan sementara dan hanya memanggil ulang geocoder jika perangkat berpindah minimal 30 meter.',
  },
  {
    icon: 'power-outline',
    title: '4. Pembersihan Listener (Lifecycle Cleanup)',
    desc: 'Memanggil subscription.remove() saat pelacakan dihentikan atau komponen unmount untuk mencegah kebocoran baterai di background.',
  },
  {
    icon: 'radio-button-on-outline',
    title: '5. Geofencing Event-Driven',
    desc: 'Menentukan batas radius area (100–300m) dan hanya memicu notifikasi ketika terjadi transisi status ENTER/EXIT, bukan mengirim notifikasi berulang tiap detik.',
  },
];

export default function LocationScreen() {
  const router = useRouter();
  const {
    permissionStatus,
    gpsServicesEnabled,
    isTracking,
    isSimulated,
    isLoadingLocation,
    powerMode,
    currentLocation,
    address,
    geocodeRequestCount,
    geocodeCacheHits,
    zones,
    activeZone,
    radiusMeters,
    distanceMeters,
    isInsideGeofence,
    geofenceEvents,
    requestAccessAndFetchGps,
    refreshCurrentLocation,
    startLiveTracking,
    stopLiveTracking,
    setPowerMode,
    selectZone,
    setRadiusMeters,
    setCurrentLocationAsZone,
    refreshReverseGeocode,
    simulateEnterGeofence,
    simulateExitGeofence,
    moveToCoordinate,
    resumeRealGps,
    clearGeofenceEvents,
  } = useLocationTracking();

  const activeProfile = POWER_PROFILES[powerMode];

  const checklistItems = [
    { num: 1, label: 'Akses GPS', done: permissionStatus === 'granted' || isSimulated },
    { num: 2, label: 'Baca Koordinat', done: !!currentLocation },
    { num: 3, label: 'Peta Interaktif', done: true },
    { num: 4, label: 'Marker & Radius', done: true },
    { num: 5, label: 'Reverse Geocoding', done: !!address },
    { num: 6, label: 'Uji Geofencing', done: geofenceEvents.length > 0 || isInsideGeofence },
    { num: 7, label: 'Optimasi Baterai', done: true },
  ];

  const formatTime = (msOrIso: number | string) => {
    try {
      return new Date(msOrIso).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'Baru saja';
    }
  };

  const getPermBadge = () => {
    if (permissionStatus === 'granted') {
      return { text: 'GPS Diizinkan', bg: '#DCFCE7', color: '#15803D' };
    }
    if (permissionStatus === 'denied') {
      return { text: 'Izin Ditolak', bg: '#FEE2E2', color: '#DC2626' };
    }
    return { text: 'Belum Diminta', bg: '#FEF3C7', color: '#92400E' };
  };

  const permBadge = getPermBadge();

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Lokasi & Geofencing</Text>
            <View style={styles.sprintBadge}>
              <Text style={styles.sprintBadgeText}>Sprint 08</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>GPS, Peta, Reverse Geocoding & Hemat Baterai</Text>
        </View>

        <Pressable
          onPress={() => router.push('/notifications' as any)}
          style={({ pressed }) => [styles.notifShortcutBtn, pressed && styles.pressed]}
        >
          <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 7-Point Demo Checklist Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.checklistScroll}>
          {checklistItems.map((item) => (
            <View
              key={item.num}
              style={[styles.checkPill, item.done && styles.checkPillDone]}
            >
              <View style={[styles.checkNum, item.done && styles.checkNumDone]}>
                {item.done ? (
                  <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                ) : (
                  <Text style={styles.checkNumText}>{item.num}</Text>
                )}
              </View>
              <Text style={[styles.checkLabel, item.done && styles.checkLabelDone]}>
                {item.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* STEP 3 & 4: INTERACTIVE MAP + MARKERS + GEOFENCE CIRCLE */}
        <LocationMapView
          currentLocation={currentLocation}
          activeZone={activeZone}
          radiusMeters={radiusMeters}
          isInsideGeofence={isInsideGeofence}
          onSelectCoordinate={(lat, lng) => void moveToCoordinate(lat, lng, 'simulation')}
        />

        {/* FLOATING-STYLE SUMMARY CARD BELOW MAP (Matches Mockup: Lokasi Saya, Alamat, Geofence) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="location" size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.summaryLabelRow}>
                <Text style={styles.summaryTitle}>Lokasi Saya</Text>
                <View
                  style={[
                    styles.modeTag,
                    { backgroundColor: isSimulated ? '#FEF3C7' : '#ECFDF5' },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeTagText,
                      { color: isSimulated ? '#92400E' : '#065F46' },
                    ]}
                  >
                    {isSimulated ? 'Mode Simulasi' : isTracking ? 'GPS Live' : 'GPS Snapshot'}
                  </Text>
                </View>
              </View>
              <Text style={styles.coordMono}>
                Lat: {currentLocation.latitude.toFixed(4)}, Lng: {currentLocation.longitude.toFixed(4)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          {/* Reverse Geocoding Address */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="navigate-circle" size={18} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Alamat (Reverse Geocoding)</Text>
              <Text style={styles.addressText}>
                {address?.formattedAddress || 'Mengambil alamat dari koordinat...'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          {/* Geofence Status Badge */}
          <View
            style={[
              styles.geofenceStatusBanner,
              { backgroundColor: isInsideGeofence ? '#ECFDF5' : '#FEF3C7' },
            ]}
          >
            <Ionicons
              name={isInsideGeofence ? 'shield-checkmark' : 'alert-circle'}
              size={18}
              color={isInsideGeofence ? '#15803D' : '#B45309'}
            />
            <Text
              style={[
                styles.geofenceStatusText,
                { color: isInsideGeofence ? '#15803D' : '#92400E' },
              ]}
            >
              {isInsideGeofence
                ? `Dalam Area Geofence ✓ (${distanceMeters}m dari pusat)`
                : `Di Luar Area Geofence (${distanceMeters}m • batas ${radiusMeters}m)`}
            </Text>
          </View>
        </View>

        {/* STEP 1 & 2: AKSES GPS & BACA KOORDINAT */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepCircleText}>1-2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Akses GPS & Baca Koordinat</Text>
              <Text style={styles.cardSub}>
                Izin Foreground Location, status sensor GPS, dan pembacaan koordinat real-time.
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: permBadge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: permBadge.color }]}>
                {permBadge.text}
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Latitude</Text>
              <Text style={styles.metricValue}>{currentLocation.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Longitude</Text>
              <Text style={styles.metricValue}>{currentLocation.longitude.toFixed(6)}</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Akurasi</Text>
              <Text style={styles.metricValue}>
                {currentLocation.accuracy ? `±${Math.round(currentLocation.accuracy)} m` : 'N/A'}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>GPS Hardware</Text>
              <Text style={styles.metricValue}>
                {gpsServicesEnabled ? 'Aktif' : 'Nonaktif'} • {formatTime(currentLocation.timestamp)}
              </Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <Pressable
              onPress={() =>
                void (permissionStatus === 'granted'
                  ? refreshCurrentLocation()
                  : requestAccessAndFetchGps())
              }
              disabled={isLoadingLocation}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="compass" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.primaryBtnText}>
                {permissionStatus === 'granted' ? 'Baca Koordinat GPS' : 'Akses GPS & Izin'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => void (isTracking ? stopLiveTracking() : startLiveTracking())}
              style={({ pressed }) => [
                styles.outlineBtn,
                isTracking && styles.outlineBtnActive,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={isTracking ? 'stop-circle' : 'radio'}
                size={16}
                color={isTracking ? '#DC2626' : COLORS.primary}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.outlineBtnText, isTracking && { color: '#DC2626' }]}>
                {isTracking ? 'Stop Live' : 'Lacak Live'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* STEP 5: REVERSE GEOCODING */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepCircleText}>5</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Reverse Geocoding</Text>
              <Text style={styles.cardSub}>
                Mengonversi koordinat Latitude/Longitude menjadi alamat jalan & kota terbaca.
              </Text>
            </View>
          </View>

          <View style={styles.geocodeBox}>
            <Text style={styles.geocodeMain}>
              {address?.formattedAddress || 'Belum ada alamat'}
            </Text>
            <View style={styles.geocodeMetaRow}>
              <Text style={styles.geocodeMeta}>
                Kota: {address?.city || '-'} • Kec: {address?.district || '-'}
              </Text>
              <View style={styles.sourcePill}>
                <Text style={styles.sourcePillText}>{address?.source || 'geocoder'}</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => void refreshReverseGeocode(true)}
            style={({ pressed }) => [styles.softBtn, pressed && styles.pressed]}
          >
            <Ionicons name="map-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.softBtnText}>Jalankan Reverse Geocoding Sekarang</Text>
          </Pressable>
        </View>

        {/* STEP 6: UJI GEOFENCING (MASUK AREA & NOTIFIKASI) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepCircleText}>6</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Uji Geofencing & Notifikasi</Text>
              <Text style={styles.cardSub}>
                Memantau jarak Haversine ke area target dan memicu notifikasi otomatis saat masuk/keluar area.
              </Text>
            </View>
          </View>

          {/* Zone Selector */}
          <Text style={styles.subLabel}>Pilih Zona Geofence:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {zones.map((z) => {
              const active = z.id === activeZone.id;
              return (
                <Pressable
                  key={z.id}
                  onPress={() => selectZone(z.id)}
                  style={[styles.selectChip, active && styles.selectChipActive]}
                >
                  <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>
                    {z.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={setCurrentLocationAsZone}
              style={({ pressed }) => [styles.selectChip, pressed && styles.pressed]}
            >
              <Text style={styles.selectChipText}>+ Jadikan GPS Saya Pusat</Text>
            </Pressable>
          </ScrollView>

          {/* Radius Selector */}
          <View style={styles.radiusRow}>
            <Text style={styles.subLabel}>Radius Area:</Text>
            <View style={styles.radiusChips}>
              {[100, 150, 300].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRadiusMeters(r)}
                  style={[styles.radiusChip, radiusMeters === r && styles.radiusChipActive]}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      radiusMeters === r && styles.radiusChipTextActive,
                    ]}
                  >
                    {r}m
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Geofence Simulation Buttons */}
          <View style={styles.btnRow}>
            <Pressable
              onPress={() => void simulateEnterGeofence()}
              style={({ pressed }) => [styles.enterGeoBtn, pressed && styles.pressed]}
            >
              <Ionicons name="enter-outline" size={16} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.enterGeoBtnText}>Simulasi Masuk Area</Text>
            </Pressable>

            <Pressable
              onPress={() => void simulateExitGeofence()}
              style={({ pressed }) => [styles.exitGeoBtn, pressed && styles.pressed]}
            >
              <Ionicons name="exit-outline" size={16} color="#B45309" style={{ marginRight: 5 }} />
              <Text style={styles.exitGeoBtnText}>Simulasi Keluar</Text>
            </Pressable>
          </View>

          {isSimulated && (
            <Pressable
              onPress={() => void resumeRealGps()}
              style={({ pressed }) => [styles.resumeGpsBtn, pressed && styles.pressed]}
            >
              <Ionicons name="locate" size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.resumeGpsText}>Kembali ke Koordinat GPS Asli</Text>
            </Pressable>
          )}

          {/* Geofence Event Log */}
          <View style={styles.eventsHeader}>
            <Text style={styles.subLabel}>Log Event Geofence & Notifikasi ({geofenceEvents.length})</Text>
            {geofenceEvents.length > 0 && (
              <Pressable onPress={clearGeofenceEvents}>
                <Text style={styles.clearText}>Bersihkan</Text>
              </Pressable>
            )}
          </View>

          {geofenceEvents.length === 0 ? (
            <Text style={styles.emptyLogText}>
              Belum ada transisi geofence. Tekan &quot;Simulasi Masuk Area&quot; atau ketuk peta untuk menguji notifikasi masuk area.
            </Text>
          ) : (
            geofenceEvents.slice(0, 5).map((ev) => (
              <View key={ev.id} style={styles.eventItem}>
                <View
                  style={[
                    styles.eventBadge,
                    { backgroundColor: ev.type === 'ENTER' ? '#DCFCE7' : '#FEF3C7' },
                  ]}
                >
                  <Text
                    style={[
                      styles.eventBadgeText,
                      { color: ev.type === 'ENTER' ? '#15803D' : '#92400E' },
                    ]}
                  >
                    {ev.type}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{ev.zoneName}</Text>
                  <Text style={styles.eventSub}>
                    Jarak {ev.distanceMeters}m • {ev.source === 'simulation' ? 'Simulasi' : 'GPS'} •{' '}
                    {formatTime(ev.timestamp)}
                  </Text>
                </View>
                <Ionicons name="notifications" size={15} color={COLORS.primary} />
              </View>
            ))
          )}
        </View>

        {/* STEP 7: OPTIMASI BATERAI (EFISIENSI PELACAKAN LOKASI) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="battery-charging" size={16} color="#15803D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Optimasi Baterai Pelacakan Lokasi</Text>
              <Text style={styles.cardSub}>
                Konfigurasi profil daya & strategi efisiensi GPS pada aplikasi mobile.
              </Text>
            </View>
          </View>

          {/* Power Mode Selector */}
          <View style={styles.powerTabsRow}>
            {(['battery_saver', 'balanced', 'high_accuracy'] as PowerMode[]).map((mode) => {
              const profile = POWER_PROFILES[mode];
              const active = powerMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setPowerMode(mode)}
                  style={[styles.powerTab, active && styles.powerTabActive]}
                >
                  <Text style={[styles.powerTabText, active && styles.powerTabTextActive]}>
                    {profile.shortLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Active Power Profile Telemetry */}
          <View style={styles.powerSummaryBox}>
            <Text style={styles.powerProfileName}>{activeProfile.label}</Text>
            <Text style={styles.powerProfileDesc}>{activeProfile.description}</Text>

            <View style={styles.powerStatsRow}>
              <View style={styles.powerStatChip}>
                <Text style={styles.powerStatKey}>Accuracy</Text>
                <Text style={styles.powerStatVal}>{activeProfile.accuracyLabel}</Text>
              </View>
              <View style={styles.powerStatChip}>
                <Text style={styles.powerStatKey}>Interval</Text>
                <Text style={styles.powerStatVal}>
                  {activeProfile.distanceInterval}m / {activeProfile.timeInterval / 1000}s
                </Text>
              </View>
              <View style={styles.powerStatChip}>
                <Text style={styles.powerStatKey}>Konsumsi</Text>
                <Text style={styles.powerStatVal}>{activeProfile.batteryImpact}</Text>
              </View>
              <View style={styles.powerStatChip}>
                <Text style={styles.powerStatKey}>Cache Geocode</Text>
                <Text style={styles.powerStatVal}>
                  {geocodeCacheHits} hemat / {geocodeRequestCount} req
                </Text>
              </View>
            </View>
          </View>

          {/* 5 Structured Explanations */}
          {BATTERY_OPTIMIZATION_TIPS.map((tip) => (
            <View key={tip.title} style={styles.tipRow}>
              <View style={styles.tipIconBox}>
                <Ionicons name={tip.icon as any} size={17} color={COLORS.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sprint 08 Completion Banner */}
        <View style={styles.completionBanner}>
          <View style={styles.completionIcon}>
            <Ionicons name="flag" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.completionTitle}>Sprint 08 Completion • Location-Based RuangKos</Text>
            <Text style={styles.completionSub}>
              GPS, koordinat, peta interaktif, marker, reverse geocoding, geofencing, dan optimasi baterai siap didemonstrasikan.
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingTop: 54,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sprintBadge: {
    backgroundColor: COLORS.accentYellow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  sprintBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 1,
  },
  notifShortcutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  checklistScroll: {
    marginBottom: SPACING.md,
  },
  checkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  checkPillDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  checkNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  checkNumDone: {
    backgroundColor: COLORS.secondary,
  },
  checkNumText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  checkLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  checkLabelDone: {
    color: '#065F46',
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  modeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  coordMono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceMuted,
    marginVertical: 10,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  geofenceStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  geofenceStatusText: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepCircle: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 6,
  },
  stepCircleText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.text,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginLeft: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    width: '48.5%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  outlineBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  outlineBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  geocodeBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 10,
  },
  geocodeMain: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 19,
  },
  geocodeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  geocodeMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  sourcePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  sourcePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  softBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
  },
  softBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  chipScroll: {
    marginBottom: 12,
  },
  selectChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  selectChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: COLORS.primary,
  },
  selectChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  selectChipTextActive: {
    color: COLORS.primary,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  radiusChips: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  radiusChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: COLORS.secondary,
  },
  radiusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  radiusChipTextActive: {
    color: '#065F46',
  },
  enterGeoBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    paddingVertical: 11,
  },
  enterGeoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  exitGeoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  exitGeoBtnText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
  },
  resumeGpsBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.md,
    paddingVertical: 9,
  },
  resumeGpsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  emptyLogText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    gap: 10,
  },
  eventBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  eventSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  powerTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  powerTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
  },
  powerTabActive: {
    backgroundColor: '#ECFDF5',
    borderColor: COLORS.secondary,
  },
  powerTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  powerTabTextActive: {
    color: '#065F46',
    fontWeight: '800',
  },
  powerSummaryBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: 12,
  },
  powerProfileName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  powerProfileDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  powerStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  powerStatChip: {
    width: '48.5%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  powerStatKey: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  powerStatVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    gap: 10,
  },
  tipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  tipDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.secondary,
    gap: 12,
  },
  completionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  completionSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});

