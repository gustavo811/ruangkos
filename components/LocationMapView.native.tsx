import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { GeoCoordinate, GeofenceZone } from '../types';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

export interface LocationMapViewProps {
  currentLocation: GeoCoordinate;
  activeZone: GeofenceZone;
  radiusMeters: number;
  isInsideGeofence: boolean;
  onSelectCoordinate?: (latitude: number, longitude: number) => void;
}

export const LocationMapView: React.FC<LocationMapViewProps> = ({
  currentLocation,
  activeZone,
  radiusMeters,
  isInsideGeofence,
  onSelectCoordinate,
}) => {
  const mapRef = useRef<MapView | null>(null);
  const [delta, setDelta] = useState<number>(0.006);

  const buildRegion = (lat: number, lng: number, span: number): Region => ({
    latitude: lat,
    longitude: lng,
    latitudeDelta: span,
    longitudeDelta: span,
  });

  useEffect(() => {
    mapRef.current?.animateToRegion(
      buildRegion(currentLocation.latitude, currentLocation.longitude, delta),
      450
    );
  }, [currentLocation.latitude, currentLocation.longitude, delta]);

  const handleZoomIn = () => {
    const next = Math.max(0.0015, delta * 0.6);
    setDelta(next);
    mapRef.current?.animateToRegion(
      buildRegion(currentLocation.latitude, currentLocation.longitude, next),
      250
    );
  };

  const handleZoomOut = () => {
    const next = Math.min(0.08, delta * 1.6);
    setDelta(next);
    mapRef.current?.animateToRegion(
      buildRegion(currentLocation.latitude, currentLocation.longitude, next),
      250
    );
  };

  const handleRecenter = () => {
    mapRef.current?.animateToRegion(
      buildRegion(currentLocation.latitude, currentLocation.longitude, delta),
      350
    );
  };

  return (
    <View style={styles.mapWrapper}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={buildRegion(currentLocation.latitude, currentLocation.longitude, delta)}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onSelectCoordinate?.(latitude, longitude);
        }}
      >
        {/* Geofence Boundary Circle */}
        <Circle
          center={{
            latitude: activeZone.latitude,
            longitude: activeZone.longitude,
          }}
          radius={radiusMeters}
          strokeWidth={2}
          strokeColor={isInsideGeofence ? '#10B981' : COLORS.primary}
          fillColor={
            isInsideGeofence
              ? 'rgba(16, 185, 129, 0.16)'
              : 'rgba(108, 92, 231, 0.16)'
          }
          lineDashPattern={[6, 4]}
        />

        {/* Geofence Center Marker */}
        <Marker
          coordinate={{
            latitude: activeZone.latitude,
            longitude: activeZone.longitude,
          }}
          title={activeZone.name}
          description={`Radius Geofence ${radiusMeters}m`}
          pinColor={COLORS.primary}
        />

        {/* User Position Marker */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Lokasi Saya"
          description={`Lat: ${currentLocation.latitude.toFixed(4)}, Lng: ${currentLocation.longitude.toFixed(4)}`}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.userMarkerOuter}>
            <View style={styles.userMarkerInner} />
          </View>
        </Marker>
      </MapView>

      {/* Top Floating Zone Pill */}
      <View style={styles.zonePill}>
        <Ionicons name="business" size={14} color={COLORS.primary} />
        <Text style={styles.zonePillText}>{activeZone.name}</Text>
      </View>

      {/* Right Map Controls (Recenter, +, -) */}
      <View style={styles.controlsCol}>
        <Pressable
          onPress={handleRecenter}
          style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
        >
          <Ionicons name="locate" size={18} color={COLORS.text} />
        </Pressable>
        <Pressable
          onPress={handleZoomIn}
          style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={19} color={COLORS.text} />
        </Pressable>
        <Pressable
          onPress={handleZoomOut}
          style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
        >
          <Ionicons name="remove" size={19} color={COLORS.text} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapWrapper: {
    height: 310,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.medium,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  zonePill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.small,
  },
  zonePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  controlsCol: {
    position: 'absolute',
    right: 12,
    bottom: 14,
    gap: 8,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  userMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2563EB',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
});

