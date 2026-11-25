import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import {
  GeoCoordinate,
  GeocodedAddress,
  GeofenceEvent,
  GeofenceZone,
  LocationPermissionState,
  PowerMode,
} from '../types';
import {
  PRESET_GEOFENCE_ZONES,
  calculateDistanceMeters,
  checkGpsStatus,
  readCurrentGpsPosition,
  requestGpsPermission,
  reverseGeocodePosition,
  subscribeGpsUpdates,
} from '../services/locationService';
import { useApp } from './AppContext';
import { useNotifications } from './NotificationContext';

interface LocationContextType {
  permissionStatus: LocationPermissionState;
  gpsServicesEnabled: boolean;
  isTracking: boolean;
  isSimulated: boolean;
  isLoadingLocation: boolean;
  powerMode: PowerMode;
  currentLocation: GeoCoordinate;
  address: GeocodedAddress | null;
  geocodeRequestCount: number;
  geocodeCacheHits: number;

  zones: GeofenceZone[];
  activeZone: GeofenceZone;
  radiusMeters: number;
  distanceMeters: number;
  isInsideGeofence: boolean;
  geofenceEvents: GeofenceEvent[];

  // Actions
  requestAccessAndFetchGps: () => Promise<boolean>;
  refreshCurrentLocation: () => Promise<void>;
  startLiveTracking: () => Promise<void>;
  stopLiveTracking: () => void;
  setPowerMode: (mode: PowerMode) => void;
  selectZone: (zoneId: string) => void;
  setRadiusMeters: (radius: number) => void;
  setCurrentLocationAsZone: () => void;
  refreshReverseGeocode: (force?: boolean) => Promise<void>;

  // Geofencing Simulation & Interactive Pin Testing
  simulateEnterGeofence: () => Promise<void>;
  simulateExitGeofence: () => Promise<void>;
  moveToCoordinate: (lat: number, lng: number, source?: 'gps_live' | 'simulation') => Promise<void>;
  resumeRealGps: () => Promise<void>;
  clearGeofenceEvents: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const DEFAULT_COORD: GeoCoordinate = {
  latitude: -7.9666,
  longitude: 112.6326,
  accuracy: 12,
  altitude: 445,
  speed: 0,
  timestamp: 1795601517759,
};

const DEFAULT_ADDRESS: GeocodedAddress = {
  formattedAddress: 'Jl. Melati No.21, Lowokwaru, Kota Malang',
  street: 'Jl. Melati No.21',
  district: 'Lowokwaru',
  city: 'Kota Malang',
  country: 'Indonesia',
  source: 'cached_fallback',
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useApp();
  const { sendPushNotification } = useNotifications();

  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionState>('undetermined');
  const [gpsServicesEnabled, setGpsServicesEnabled] = useState<boolean>(true);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [powerMode, setPowerModeState] = useState<PowerMode>('balanced');

  const [zones, setZones] = useState<GeofenceZone[]>(PRESET_GEOFENCE_ZONES);
  const [activeZoneId, setActiveZoneId] = useState<string>(PRESET_GEOFENCE_ZONES[1].id);
  const [radiusMeters, setRadiusMetersState] = useState<number>(150);

  const [currentLocation, setCurrentLocation] = useState<GeoCoordinate>(DEFAULT_COORD);
  const [address, setAddress] = useState<GeocodedAddress | null>(DEFAULT_ADDRESS);
  const [geocodeRequestCount, setGeocodeRequestCount] = useState<number>(0);
  const [geocodeCacheHits, setGeocodeCacheHits] = useState<number>(0);
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);

  const watchSubRef = useRef<Location.LocationSubscription | null>(null);
  const lastGeocodedCoordRef = useRef<{ lat: number; lng: number } | null>(null);
  const prevInsideRef = useRef<boolean | null>(null);
  const isSimulatedRef = useRef<boolean>(false);

  useEffect(() => {
    isSimulatedRef.current = isSimulated;
  }, [isSimulated]);

  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];

  const distanceMeters = calculateDistanceMeters(
    currentLocation.latitude,
    currentLocation.longitude,
    activeZone.latitude,
    activeZone.longitude
  );

  const isInsideGeofence = distanceMeters <= radiusMeters;

  // Bootstrap initial permission status on mount
  useEffect(() => {
    let mounted = true;
    async function init() {
      const status = await checkGpsStatus();
      if (!mounted) return;
      setPermissionStatus(status.permission);
      setGpsServicesEnabled(status.servicesEnabled);
    }
    void init();

    return () => {
      mounted = false;
      if (watchSubRef.current) {
        watchSubRef.current.remove();
        watchSubRef.current = null;
      }
    };
  }, []);

  /**
   * Step 5 & 7: Reverse Geocode with 30m distance cache to save battery & network.
   */
  const performReverseGeocode = useCallback(
    async (lat: number, lng: number, force = false) => {
      if (!force && lastGeocodedCoordRef.current) {
        const movedMeters = calculateDistanceMeters(
          lat,
          lng,
          lastGeocodedCoordRef.current.lat,
          lastGeocodedCoordRef.current.lng
        );
        if (movedMeters < 30) {
          setGeocodeCacheHits((prev) => prev + 1);
          return;
        }
      }

      const resolved = await reverseGeocodePosition(lat, lng, zones);
      lastGeocodedCoordRef.current = { lat, lng };
      setGeocodeRequestCount((prev) => prev + 1);
      setAddress(resolved);
    },
    [zones]
  );

  /**
   * Step 6: Evaluate Geofence boundary transitions and fire notification on ENTER/EXIT.
   */
  const evaluateGeofenceTransition = useCallback(
    (
      coord: GeoCoordinate,
      zone: GeofenceZone,
      radius: number,
      source: 'gps_live' | 'simulation',
      forceNotifyOnSameState = false
    ) => {
      const dist = calculateDistanceMeters(
        coord.latitude,
        coord.longitude,
        zone.latitude,
        zone.longitude
      );
      const inside = dist <= radius;
      const prevInside = prevInsideRef.current;
      prevInsideRef.current = inside;

      const entered = prevInside === false && inside;
      const exited = prevInside === true && !inside;
      const firstEnter = (prevInside === null || forceNotifyOnSameState) && inside;

      if (entered || firstEnter) {
        const event: GeofenceEvent = {
          id: `geo-${Date.now()}`,
          zoneId: zone.id,
          zoneName: zone.name,
          type: 'ENTER',
          distanceMeters: dist,
          timestamp: new Date().toISOString(),
          source,
        };
        setGeofenceEvents((prev) => [event, ...prev.slice(0, 19)]);

        if (settings.hapticEnabled) {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }

        void sendPushNotification({
          title: `📍 Masuk ${zone.name}!`,
          subtitle: 'Geofencing Triggered',
          body: `Perangkat berada di dalam radius ${radius}m (jarak ${dist}m). Jangan lupa cek tugas piket kos!`,
          category: 'jadwal_piket',
          targetRoute: '/location',
        });
      } else if (exited) {
        const event: GeofenceEvent = {
          id: `geo-${Date.now()}`,
          zoneId: zone.id,
          zoneName: zone.name,
          type: 'EXIT',
          distanceMeters: dist,
          timestamp: new Date().toISOString(),
          source,
        };
        setGeofenceEvents((prev) => [event, ...prev.slice(0, 19)]);

        void sendPushNotification({
          title: `🚶 Keluar ${zone.name}`,
          subtitle: 'Geofencing Exit Event',
          body: `Perangkat meninggalkan radius ${radius}m (jarak saat ini ${dist}m).`,
          category: 'pengumuman',
          targetRoute: '/location',
        });
      }
    },
    [sendPushNotification, settings.hapticEnabled]
  );

  const stopLiveTracking = useCallback(() => {
    if (watchSubRef.current) {
      watchSubRef.current.remove();
      watchSubRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const refreshCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      const pos = await readCurrentGpsPosition(powerMode);
      if (pos) {
        setIsSimulated(false);
        setCurrentLocation(pos);
        await performReverseGeocode(pos.latitude, pos.longitude, true);
        evaluateGeofenceTransition(pos, activeZone, radiusMeters, 'gps_live');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  }, [activeZone, evaluateGeofenceTransition, performReverseGeocode, powerMode, radiusMeters]);

  const startLiveTracking = useCallback(async () => {
    stopLiveTracking();
    setIsLoadingLocation(true);
    try {
      const perm = await requestGpsPermission();
      setPermissionStatus(perm);
      if (perm !== 'granted') return;

      const status = await checkGpsStatus();
      setGpsServicesEnabled(status.servicesEnabled);

      const initialPos = await readCurrentGpsPosition(powerMode);
      if (initialPos) {
        setIsSimulated(false);
        setCurrentLocation(initialPos);
        await performReverseGeocode(initialPos.latitude, initialPos.longitude, true);
        evaluateGeofenceTransition(initialPos, activeZone, radiusMeters, 'gps_live');
      }

      const sub = await subscribeGpsUpdates(powerMode, (coord) => {
        if (isSimulatedRef.current) return;
        setCurrentLocation(coord);
        void performReverseGeocode(coord.latitude, coord.longitude, false);
        evaluateGeofenceTransition(coord, activeZone, radiusMeters, 'gps_live');
      });

      if (sub) {
        watchSubRef.current = sub;
        setIsTracking(true);
      }
    } finally {
      setIsLoadingLocation(false);
    }
  }, [
    activeZone,
    evaluateGeofenceTransition,
    performReverseGeocode,
    powerMode,
    radiusMeters,
    stopLiveTracking,
  ]);

  const requestAccessAndFetchGps = useCallback(async (): Promise<boolean> => {
    setIsLoadingLocation(true);
    try {
      const perm = await requestGpsPermission();
      setPermissionStatus(perm);
      const status = await checkGpsStatus();
      setGpsServicesEnabled(status.servicesEnabled);

      if (perm !== 'granted') return false;

      const pos = await readCurrentGpsPosition(powerMode);
      if (pos) {
        setIsSimulated(false);
        setCurrentLocation(pos);
        await performReverseGeocode(pos.latitude, pos.longitude, true);
        evaluateGeofenceTransition(pos, activeZone, radiusMeters, 'gps_live');
      }
      return true;
    } finally {
      setIsLoadingLocation(false);
    }
  }, [activeZone, evaluateGeofenceTransition, performReverseGeocode, powerMode, radiusMeters]);

  const setPowerMode = useCallback(
    (mode: PowerMode) => {
      setPowerModeState(mode);
      if (isTracking) {
        stopLiveTracking();
        void subscribeGpsUpdates(mode, (coord) => {
          if (isSimulatedRef.current) return;
          setCurrentLocation(coord);
          void performReverseGeocode(coord.latitude, coord.longitude, false);
          evaluateGeofenceTransition(coord, activeZone, radiusMeters, 'gps_live');
        }).then((sub) => {
          if (sub) {
            watchSubRef.current = sub;
            setIsTracking(true);
          }
        });
      }
    },
    [activeZone, evaluateGeofenceTransition, isTracking, performReverseGeocode, radiusMeters, stopLiveTracking]
  );

  const selectZone = useCallback(
    (zoneId: string) => {
      setActiveZoneId(zoneId);
      const target = zones.find((z) => z.id === zoneId);
      if (target) {
        prevInsideRef.current = null;
        evaluateGeofenceTransition(currentLocation, target, radiusMeters, 'gps_live');
      }
    },
    [currentLocation, evaluateGeofenceTransition, radiusMeters, zones]
  );

  const setRadiusMeters = useCallback(
    (radius: number) => {
      setRadiusMetersState(radius);
      evaluateGeofenceTransition(currentLocation, activeZone, radius, 'gps_live');
    },
    [activeZone, currentLocation, evaluateGeofenceTransition]
  );

  const setCurrentLocationAsZone = useCallback(() => {
    const customZone: GeofenceZone = {
      id: 'zone-custom-gps',
      name: 'Area Lokasi Saya (GPS)',
      label: 'Area Kos Saya',
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      radius: radiusMeters,
      addressHint: address?.formattedAddress || 'Lokasi GPS Perangkat Saat Ini',
    };

    setZones((prev) => {
      const withoutOld = prev.filter((z) => z.id !== 'zone-custom-gps');
      return [customZone, ...withoutOld];
    });
    setActiveZoneId('zone-custom-gps');
    prevInsideRef.current = false;
    evaluateGeofenceTransition(currentLocation, customZone, radiusMeters, 'simulation', true);
  }, [address?.formattedAddress, currentLocation, evaluateGeofenceTransition, radiusMeters]);

  const refreshReverseGeocode = useCallback(
    async (force = true) => {
      await performReverseGeocode(currentLocation.latitude, currentLocation.longitude, force);
    },
    [currentLocation.latitude, currentLocation.longitude, performReverseGeocode]
  );

  const moveToCoordinate = useCallback(
    async (lat: number, lng: number, source: 'gps_live' | 'simulation' = 'simulation') => {
      const nextCoord: GeoCoordinate = {
        latitude: lat,
        longitude: lng,
        accuracy: source === 'simulation' ? 8 : currentLocation.accuracy,
        altitude: currentLocation.altitude,
        speed: 0,
        timestamp: Date.now(),
      };
      setIsSimulated(source === 'simulation');
      setCurrentLocation(nextCoord);
      await performReverseGeocode(lat, lng, true);
      evaluateGeofenceTransition(nextCoord, activeZone, radiusMeters, source);
    },
    [
      activeZone,
      currentLocation.accuracy,
      currentLocation.altitude,
      evaluateGeofenceTransition,
      performReverseGeocode,
      radiusMeters,
    ]
  );

  const simulateEnterGeofence = useCallback(async () => {
    prevInsideRef.current = false;
    // Slight realistic offset inside radius (~15m from center)
    const lat = activeZone.latitude + 0.0001;
    const lng = activeZone.longitude + 0.00008;
    await moveToCoordinate(lat, lng, 'simulation');
  }, [activeZone.latitude, activeZone.longitude, moveToCoordinate]);

  const simulateExitGeofence = useCallback(async () => {
    prevInsideRef.current = true;
    // ~450m offset outside geofence radius
    const offsetDeg = Math.max(0.0035, (radiusMeters + 250) / 111000);
    const lat = activeZone.latitude + offsetDeg;
    const lng = activeZone.longitude + offsetDeg * 0.7;
    await moveToCoordinate(lat, lng, 'simulation');
  }, [activeZone.latitude, activeZone.longitude, moveToCoordinate, radiusMeters]);

  const resumeRealGps = useCallback(async () => {
    setIsSimulated(false);
    await refreshCurrentLocation();
  }, [refreshCurrentLocation]);

  const clearGeofenceEvents = useCallback(() => {
    setGeofenceEvents([]);
  }, []);

  return (
    <LocationContext.Provider
      value={{
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
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationTracking = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocationTracking must be used within a LocationProvider');
  }
  return ctx;
};

