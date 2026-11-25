import React, { useState } from 'react';
import {
  GestureResponderEvent,
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

function latLngToWorld(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

function worldToLatLng(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { latitude: lat, longitude: lng };
}

export const LocationMapView: React.FC<LocationMapViewProps> = ({
  currentLocation,
  activeZone,
  radiusMeters,
  isInsideGeofence,
  onSelectCoordinate,
}) => {
  const [zoom, setZoom] = useState<number>(16);
  const [centerMode, setCenterMode] = useState<'zone' | 'user'>('zone');
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 360,
    height: 310,
  });

  const centerLat =
    centerMode === 'user' ? currentLocation.latitude : activeZone.latitude;
  const centerLng =
    centerMode === 'user' ? currentLocation.longitude : activeZone.longitude;

  const TILE_SIZE = 256;
  const centerWorld = latLngToWorld(centerLat, centerLng, zoom);
  const centerTileX = Math.floor(centerWorld.x);
  const centerTileY = Math.floor(centerWorld.y);

  const projectPoint = (lat: number, lng: number) => {
    const pt = latLngToWorld(lat, lng, zoom);
    const dxPx = (pt.x - centerWorld.x) * TILE_SIZE;
    const dyPx = (pt.y - centerWorld.y) * TILE_SIZE;
    return {
      left: size.width / 2 + dxPx,
      top: size.height / 2 + dyPx,
    };
  };

  // Meters per pixel at latitude
  const metersPerPx =
    (156543.03392 * Math.cos((centerLat * Math.PI) / 180)) / Math.pow(2, zoom);
  const circleRadiusPx = Math.max(24, Math.min(180, radiusMeters / metersPerPx));

  const zonePx = projectPoint(activeZone.latitude, activeZone.longitude);
  const userPx = projectPoint(currentLocation.latitude, currentLocation.longitude);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize({ width, height });
    }
  };

  const handleMapPress = (e: GestureResponderEvent) => {
    if (!onSelectCoordinate) return;
    const { locationX, locationY } = e.nativeEvent;
    const dxTiles = (locationX - size.width / 2) / TILE_SIZE;
    const dyTiles = (locationY - size.height / 2) / TILE_SIZE;
    const target = worldToLatLng(centerWorld.x + dxTiles, centerWorld.y + dyTiles, zoom);
    onSelectCoordinate(target.latitude, target.longitude);
  };

  const tileOffsets = [-1, 0, 1];
  const centerOffsetX = (centerWorld.x - centerTileX) * TILE_SIZE;
  const centerOffsetY = (centerWorld.y - centerTileY) * TILE_SIZE;

  return (
    <View style={styles.mapWrapper} onLayout={handleLayout}>
      <Pressable onPress={handleMapPress} style={styles.mapCanvas}>
        {/* Subtle grid fallback if offline */}
        <View style={styles.gridBackdrop} />

        {/* OpenStreetMap Slippy Tiles (3x3 around center) */}
        {tileOffsets.map((dy) =>
          tileOffsets.map((dx) => {
            const tx = centerTileX + dx;
            const ty = centerTileY + dy;
            const tileLeft = size.width / 2 - centerOffsetX + dx * TILE_SIZE;
            const tileTop = size.height / 2 - centerOffsetY + dy * TILE_SIZE;
            return (
              <Image
                key={`${zoom}-${tx}-${ty}`}
                source={{ uri: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png` }}
                style={{
                  position: 'absolute',
                  left: tileLeft,
                  top: tileTop,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
              />
            );
          })
        )}

        {/* Geofence Dashed Circle */}
        <View
          pointerEvents="none"
          style={[
            styles.geofenceCircle,
            {
              width: circleRadiusPx * 2,
              height: circleRadiusPx * 2,
              borderRadius: circleRadiusPx,
              left: zonePx.left - circleRadiusPx,
              top: zonePx.top - circleRadiusPx,
              borderColor: isInsideGeofence ? '#10B981' : COLORS.primary,
              backgroundColor: isInsideGeofence
                ? 'rgba(16, 185, 129, 0.16)'
                : 'rgba(108, 92, 231, 0.18)',
            },
          ]}
        />

        {/* Geofence Zone Marker Pin */}
        <View
          pointerEvents="none"
          style={[
            styles.zonePinWrap,
            {
              left: zonePx.left - 16,
              top: zonePx.top - 32,
            },
          ]}
        >
          <Ionicons name="location" size={32} color="#EF4444" />
        </View>

        {/* User Blue Marker Dot */}
        <View
          pointerEvents="none"
          style={[
            styles.userMarkerOuter,
            {
              left: userPx.left - 13,
              top: userPx.top - 13,
            },
          ]}
        >
          <View style={styles.userMarkerInner} />
        </View>
      </Pressable>

      {/* Top Floating Zone Pill */}
      <View pointerEvents="none" style={styles.zonePill}>
        <Ionicons name="business" size={14} color={COLORS.primary} />
        <Text style={styles.zonePillText}>{activeZone.name}</Text>
      </View>

      {/* Interactive Tip */}
      <View pointerEvents="none" style={styles.tapTipBadge}>
        <Text style={styles.tapTipText}>Ketuk peta untuk uji pindah posisi</Text>
      </View>

      {/* Right Map Controls (Recenter, +, -) */}
      <View style={styles.controlsCol}>
        <Pressable
          onPress={() => setCenterMode((prev) => (prev === 'zone' ? 'user' : 'zone'))}
          style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
        >
          <Ionicons name="locate" size={18} color={COLORS.text} />
        </Pressable>
        <Pressable
          onPress={() => setZoom((z) => Math.min(18, z + 1))}
          style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={19} color={COLORS.text} />
        </Pressable>
        <Pressable
          onPress={() => setZoom((z) => Math.max(12, z - 1))}
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
    backgroundColor: '#DCE6D5',
    borderWidth: 1.5,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.medium,
  },
  mapCanvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  gridBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#E8EFE4',
  },
  geofenceCircle: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  zonePinWrap: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerOuter: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
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
  tapTipBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  tapTipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }],
  },
});
