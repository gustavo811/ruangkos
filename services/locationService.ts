import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { LocationAccuracy } from 'expo-location';
import {
  GeoCoordinate,
  GeocodedAddress,
  GeofenceZone,
  LocationPermissionState,
  PowerMode,
} from '../types';

export interface PowerProfileConfig {
  mode: PowerMode;
  label: string;
  shortLabel: string;
  accuracy: LocationAccuracy;
  accuracyLabel: string;
  distanceInterval: number; // meters
  timeInterval: number; // ms
  batteryImpact: string;
  description: string;
}

export const POWER_PROFILES: Record<PowerMode, PowerProfileConfig> = {
  battery_saver: {
    mode: 'battery_saver',
    label: 'Hemat Baterai',
    shortLabel: 'Hemat',
    accuracy: LocationAccuracy.Low,
    accuracyLabel: 'Accuracy.Low (~1 km, Wi-Fi/Cell)',
    distanceInterval: 100,
    timeInterval: 30000,
    batteryImpact: 'Rendah (~2%/jam)',
    description:
      'Meminimalkan chip GPS aktif dengan mengandalkan Wi-Fi/seluler dan pembaruan tiap 100m atau 30 detik.',
  },
  balanced: {
    mode: 'balanced',
    label: 'Seimbang (Rekomendasi)',
    shortLabel: 'Seimbang',
    accuracy: LocationAccuracy.Balanced,
    accuracyLabel: 'Accuracy.Balanced (~100 m)',
    distanceInterval: 25,
    timeInterval: 10000,
    batteryImpact: 'Sedang (~5%/jam)',
    description:
      'Kompromi optimal antara akurasi area kos dan efisiensi daya dengan distanceInterval 25m & timeInterval 10 detik.',
  },
  high_accuracy: {
    mode: 'high_accuracy',
    label: 'Akurasi Tinggi (GPS)',
    shortLabel: 'Tinggi',
    accuracy: LocationAccuracy.High,
    accuracyLabel: 'Accuracy.High (~10 m, GPS Penuh)',
    distanceInterval: 5,
    timeInterval: 3000,
    batteryImpact: 'Tinggi (~12%/jam)',
    description:
      'Mengaktifkan satelit GPS penuh dengan pembaruan cepat tiap 5m/3 detik. Cocok untuk kalibrasi presisi singkat.',
  },
};

export const PRESET_GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: 'zone-kampus-umm',
    name: 'Area Kampus UMM',
    label: 'Kampus UMM',
    latitude: -7.9214,
    longitude: 112.5975,
    radius: 150,
    addressHint: 'Jl. Raya Tlogomas No.246, Lowokwaru, Kota Malang',
  },
  {
    id: 'zone-ruangkos-melati',
    name: 'Area RuangKos Melati 21',
    label: 'RuangKos Melati 21',
    latitude: -7.9666,
    longitude: 112.6326,
    radius: 150,
    addressHint: 'Jl. Melati No.21, Lowokwaru, Kota Malang',
  },
];

/**
 * Haversine formula: compute distance in meters between two WGS84 coordinates.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Step 1: Check foreground GPS permission & hardware service state.
 */
export async function checkGpsStatus(): Promise<{
  permission: LocationPermissionState;
  servicesEnabled: boolean;
}> {
  try {
    const permRes = await Location.getForegroundPermissionsAsync();
    const permission: LocationPermissionState =
      permRes.status === 'granted'
        ? 'granted'
        : permRes.status === 'denied'
          ? 'denied'
          : 'undetermined';

    let servicesEnabled = true;
    if (Platform.OS !== 'web') {
      servicesEnabled = await Location.hasServicesEnabledAsync();
    } else if (typeof navigator !== 'undefined') {
      servicesEnabled = 'geolocation' in navigator;
    }

    return { permission, servicesEnabled };
  } catch {
    return { permission: 'undetermined', servicesEnabled: true };
  }
}

export async function requestGpsPermission(): Promise<LocationPermissionState> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'denied';
  }
}

/**
 * Step 2: Read current GPS coordinates once.
 */
export async function readCurrentGpsPosition(
  powerMode: PowerMode
): Promise<GeoCoordinate | null> {
  const profile = POWER_PROFILES[powerMode];
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: profile.accuracy,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      speed: pos.coords.speed,
      timestamp: pos.timestamp || Date.now(),
    };
  } catch (error) {
    console.warn('[Location] Gagal membaca GPS:', error);
    return null;
  }
}

/**
 * Step 2 & 7: Subscribe to battery-efficient position updates.
 * Caller MUST invoke subscription.remove() on cleanup.
 */
export async function subscribeGpsUpdates(
  powerMode: PowerMode,
  onLocation: (coord: GeoCoordinate) => void
): Promise<Location.LocationSubscription | null> {
  const profile = POWER_PROFILES[powerMode];
  try {
    const sub = await Location.watchPositionAsync(
      {
        accuracy: profile.accuracy,
        distanceInterval: profile.distanceInterval,
        timeInterval: profile.timeInterval,
      },
      (pos) => {
        onLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          speed: pos.coords.speed,
          timestamp: pos.timestamp || Date.now(),
        });
      }
    );
    return sub;
  } catch (error) {
    console.warn('[Location] Gagal memulai watchPositionAsync:', error);
    return null;
  }
}

/**
 * Step 5: Reverse Geocoding (coordinates -> readable street address).
 * Uses Expo Location.reverseGeocodeAsync on mobile, with OpenStreetMap Nominatim
 * & local zone fallback for web/offline environments.
 */
export async function reverseGeocodePosition(
  latitude: number,
  longitude: number,
  fallbackZones: GeofenceZone[] = PRESET_GEOFENCE_ZONES
): Promise<GeocodedAddress> {
  // 1. Native Expo reverse geocoder on Android / iOS
  if (Platform.OS !== 'web') {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results && results.length > 0) {
        const place = results[0];
        const parts = [
          place.street && place.streetNumber
            ? `${place.street} No.${place.streetNumber}`
            : place.street || place.name,
          place.district || place.subregion,
          place.city || place.region,
        ].filter(Boolean);

        return {
          formattedAddress:
            parts.join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          street: place.street || place.name || undefined,
          district: place.district || place.subregion || undefined,
          city: place.city || undefined,
          region: place.region || undefined,
          postalCode: place.postalCode || undefined,
          country: place.country || 'Indonesia',
          source: 'expo_native',
        };
      }
    } catch (err) {
      console.warn('[Location] Native reverseGeocodeAsync fallback:', err);
    }
  }

  // 2. Web / fallback Nominatim reverse geocoding
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=id`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const addr = json?.address || {};
      const street = addr.road || addr.pedestrian || addr.suburb || json?.name;
      const district = addr.city_district || addr.suburb || addr.village;
      const city = addr.city || addr.town || addr.county || addr.state;
      const parts = [street, district, city].filter(Boolean);

      return {
        formattedAddress:
          parts.length > 0
            ? parts.join(', ')
            : json?.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        street,
        district,
        city,
        region: addr.state,
        postalCode: addr.postcode,
        country: addr.country || 'Indonesia',
        source: 'nominatim_web',
      };
    }
  } catch {
    // Offline fallback handled below
  }

  // 3. Nearest preset zone offline fallback
  let nearestZone = fallbackZones[0];
  let minDistance = Infinity;
  for (const zone of fallbackZones) {
    const dist = calculateDistanceMeters(latitude, longitude, zone.latitude, zone.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestZone = zone;
    }
  }

  if (nearestZone && minDistance <= 600) {
    return {
      formattedAddress: nearestZone.addressHint,
      street: nearestZone.addressHint.split(',')[0],
      district: 'Lowokwaru',
      city: 'Kota Malang',
      country: 'Indonesia',
      source: 'cached_fallback',
    };
  }

  return {
    formattedAddress: `Sekitar Koordinat ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Lowokwaru, Kota Malang)`,
    city: 'Kota Malang',
    country: 'Indonesia',
    source: 'cached_fallback',
  };
}

