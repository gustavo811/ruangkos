import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { NotificationPermissionState } from '../types';

export const RUANGKOS_NOTIFICATION_CHANNEL_ID = 'ruangkos-default';
export const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

let handlerConfigured = false;

/**
 * Step 1: Configure foreground notification presentation handler on app startup.
 * Uses Expo SDK 54+ NotificationBehavior flags (shouldShowBanner & shouldShowList).
 */
export function configureNotificationHandler(): void {
  if (handlerConfigured || Platform.OS === 'web') return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    handlerConfigured = true;
  } catch (error) {
    console.warn('[Notifications] Gagal mengatur notification handler:', error);
  }
}

/**
 * Configure high-importance Android notification channel (required on Android 8+).
 */
export async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(RUANGKOS_NOTIFICATION_CHANNEL_ID, {
      name: 'Pengumuman & Pengingat RuangKos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C5CE7',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  } catch (error) {
    console.warn('[Notifications] Gagal membuat Android channel:', error);
  }
}

/**
 * Step 2a: Read current notification permission status without prompting.
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionState> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = window.Notification.permission;
      if (perm === 'granted') return 'granted';
      if (perm === 'denied') return 'denied';
    }
    return 'undetermined';
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch (error) {
    console.warn('[Notifications] Error cek permission:', error);
    return 'undetermined';
  }
}

/**
 * Step 2b: Request OS notification permission ("Izinkan notifikasi?").
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await window.Notification.requestPermission();
        if (perm === 'granted') return 'granted';
        if (perm === 'denied') return 'denied';
      } catch {
        return 'granted';
      }
    }
    return 'granted';
  }

  try {
    await setupAndroidNotificationChannel();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus === 'granted') return 'granted';
    if (finalStatus === 'denied') return 'denied';
    return 'undetermined';
  } catch (error) {
    console.warn('[Notifications] Error minta permission:', error);
    return 'denied';
  }
}

export interface DeviceMetadata {
  deviceId: string;
  deviceName: string;
  platform: string;
  osVersion: string;
  isPhysicalDevice: boolean;
}

export function getDeviceMetadata(): DeviceMetadata {
  const brand = Device.brand || (Platform.OS === 'web' ? 'Web Browser' : Platform.OS);
  const model = Device.modelName || Device.deviceName || (Platform.OS === 'web' ? 'Preview Client' : 'Mobile Device');
  const osName = Device.osName || Platform.OS;
  const osVersion = Device.osVersion || String(Platform.Version || '1.0');

  return {
    deviceId: `dev_${Platform.OS}_${model.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'client'}`,
    deviceName: brand && model && !model.includes(brand) ? `${brand} ${model}` : model,
    platform: osName,
    osVersion,
    isPhysicalDevice: Platform.OS !== 'web' && Device.isDevice,
  };
}

export interface PushTokenResult {
  token: string;
  tokenType: 'expo' | 'preview';
  device: DeviceMetadata;
  note?: string;
}

function createPreviewToken(): string {
  const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `ExponentPushToken[RuangKosDemo${randomSuffix}]`;
}

/**
 * Step 4: Obtain Expo Push Token (ExponentPushToken[...]).
 * Uses real hardware token on physical devices via Notifications.getExpoPushTokenAsync,
 * and falls back gracefully to a labeled preview token on web/simulators.
 */
export async function acquireExpoPushToken(): Promise<PushTokenResult> {
  const device = getDeviceMetadata();

  if (Platform.OS === 'web') {
    return {
      token: createPreviewToken(),
      tokenType: 'preview',
      device,
      note: 'Mode Web Preview: menggunakan token simulasi ExponentPushToken untuk pengujian alur demo.',
    };
  }

  if (!Device.isDevice) {
    return {
      token: createPreviewToken(),
      tokenType: 'preview',
      device,
      note: 'Emulator/Simulator terdeteksi: menggunakan token simulasi. Gunakan perangkat fisik (Expo Go) untuk push token asli.',
    };
  }

  try {
    await setupAndroidNotificationChannel();
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    return {
      token: tokenResponse.data,
      tokenType: 'expo',
      device,
      note: 'Expo Push Token asli berhasil diambil dari Expo Push Service.',
    };
  } catch (error: any) {
    const reason = error?.message || 'Project ID EAS belum dikonfigurasi pada app.json.';
    return {
      token: createPreviewToken(),
      tokenType: 'preview',
      device,
      note: `Fallback token demo aktif (${reason}). Notifikasi lokal & navigasi tetap berjalan penuh.`,
    };
  }
}

/**
 * Step 5a: Dispatch notification via Expo Push Service HTTP API.
 */
export async function sendViaExpoPushApi(params: {
  to: string;
  title: string;
  subtitle?: string;
  body: string;
  data: Record<string, unknown>;
}): Promise<{ ok: boolean; ticketId?: string; status: 'ok' | 'error'; error?: string }> {
  try {
    const response = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: params.to,
        sound: 'default',
        title: params.title,
        subtitle: params.subtitle,
        body: params.body,
        data: params.data,
        priority: 'high',
        channelId: RUANGKOS_NOTIFICATION_CHANNEL_ID,
      }),
    });

    const json = await response.json();
    const ticket = Array.isArray(json?.data) ? json.data[0] : json?.data;

    if (response.ok && ticket?.status === 'ok') {
      return {
        ok: true,
        ticketId: ticket.id,
        status: 'ok',
      };
    }

    return {
      ok: false,
      status: 'error',
      error: ticket?.message || json?.errors?.[0]?.message || `HTTP ${response.status}`,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: 'error',
      error: error?.message || 'Gagal menghubungi Expo Push API',
    };
  }
}

/**
 * Step 5b / 6: Schedule OS-level notification (works on physical devices & emulators,
 * with browser Notification API fallback on Web).
 */
export async function presentLocalDeviceNotification(params: {
  title: string;
  subtitle?: string;
  body: string;
  data: Record<string, unknown>;
  delaySeconds?: number;
  onWebTap?: () => void;
}): Promise<string | null> {
  const delay = Math.max(0, params.delaySeconds ?? 0);

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      const fireBrowserNotification = () => {
        try {
          const n = new window.Notification(params.title, {
            body: params.body,
          });
          if (params.onWebTap) {
            n.onclick = () => {
              window.focus();
              params.onWebTap?.();
              n.close();
            };
          }
        } catch {
          // Ignore browser restrictions
        }
      };

      if (delay > 0) {
        setTimeout(fireBrowserNotification, delay * 1000);
      } else {
        fireBrowserNotification();
      }
    }
    return `web-notif-${Date.now()}`;
  }

  try {
    await setupAndroidNotificationChannel();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        subtitle: params.subtitle,
        body: params.body,
        data: params.data,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: RUANGKOS_NOTIFICATION_CHANNEL_ID } : {}),
      },
      trigger:
        delay > 0
          ? {
              type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
              seconds: delay,
              channelId: RUANGKOS_NOTIFICATION_CHANNEL_ID,
            }
          : null,
    });
    return id;
  } catch (error) {
    console.warn('[Notifications] Gagal menjadwalkan notifikasi lokal:', error);
    return null;
  }
}

