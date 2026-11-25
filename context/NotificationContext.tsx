import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  NotificationCategory,
  NotificationPermissionState,
  PushNotificationRecord,
  RegisteredDevice,
} from '../types';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { ApiService } from '../services/apiService';
import { LocalStorage, STORAGE_KEYS } from '../services/storageService';
import {
  acquireExpoPushToken,
  configureNotificationHandler,
  getDeviceMetadata,
  getNotificationPermissionStatus,
  presentLocalDeviceNotification,
  requestNotificationPermission,
  setupAndroidNotificationChannel,
} from '../services/notificationService';

// Configure foreground handler at module load (Step 1)
configureNotificationHandler();

export interface SendPushInput {
  title: string;
  subtitle?: string;
  body: string;
  category: NotificationCategory;
  targetRoute?: string;
  delaySeconds?: number;
}

export interface LastDispatchInfo {
  announcementId: string;
  ticketId: string;
  ticketStatus: 'ok' | 'error' | 'simulated';
  deliveryChannel: 'expo_push_api' | 'local_notification' | 'in_app_preview';
  providerNote: string;
  sentAt: string;
}

interface NotificationContextType {
  appInitialized: boolean;
  permissionStatus: NotificationPermissionState;
  registeredDevice: RegisteredDevice | null;
  expoPushToken: string | null;
  tokenType: 'expo' | 'preview' | null;
  tokenNote: string | null;
  lastDispatch: LastDispatchInfo | null;
  notifications: PushNotificationRecord[];
  unreadCount: number;
  hasReceivedNotification: boolean;
  hasOpenedNotification: boolean;
  lastOpenedId: string | null;
  isBusy: boolean;

  // Step 2: Request / Deny Permission
  refreshPermissionStatus: () => Promise<NotificationPermissionState>;
  requestPermission: () => Promise<NotificationPermissionState>;
  denyPermissionDemo: () => void;

  // Step 3 & 4: Register Device & Get Push Token
  fetchPushToken: () => Promise<string | null>;
  registerDevice: () => Promise<RegisteredDevice | null>;
  setupPushPipeline: () => Promise<boolean>;

  // Step 5 & 6: Send & Receive Notification
  sendPushNotification: (input: SendPushInput) => Promise<PushNotificationRecord | null>;

  // Step 7: Tap & Navigate to Target Screen
  openNotification: (record: PushNotificationRecord) => void;
  openNotificationById: (id: string) => void;

  // Inbox Utilities
  markAllAsRead: () => Promise<void>;
  clearHistory: () => Promise<void>;
  resetDemoState: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const SEED_ANNOUNCEMENTS: PushNotificationRecord[] = [
  {
    id: 'ann-welcome-ruangkos',
    title: 'Pengumuman Baru Kos Melati 21',
    subtitle: 'Jadwal Piket Mingguan Diperbarui',
    body: 'Jadwal kebersihan minggu ini sudah aktif. Pastikan area dapur, kamar mandi, dan tempat sampah dicek sesuai giliran masing-masing penghuni.',
    category: 'pengumuman',
    sender: 'Erling Rascals (Ketua Kos)',
    targetRoute: '/announcement/ann-welcome-ruangkos',
    data: {
      announcementId: 'ann-welcome-ruangkos',
      targetRoute: '/announcement/ann-welcome-ruangkos',
      category: 'pengumuman',
      kosName: 'RuangKos Melati 21',
    },
    deliveryChannel: 'local_notification',
    ticketId: 'seed-initial-01',
    ticketStatus: 'ok',
    receivedAt: '2026-11-25T07:00:00.000Z',
    isRead: false,
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { token: authJwtToken, user } = useAuth();
  const { triggerNotification, settings } = useApp();

  const [appInitialized, setAppInitialized] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionState>('undetermined');
  const [registeredDevice, setRegisteredDevice] = useState<RegisteredDevice | null>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<'expo' | 'preview' | null>(null);
  const [tokenNote, setTokenNote] = useState<string | null>(null);
  const [lastDispatch, setLastDispatch] = useState<LastDispatchInfo | null>(null);
  const [notifications, setNotifications] = useState<PushNotificationRecord[]>(SEED_ANNOUNCEMENTS);
  const [hasReceivedNotification, setHasReceivedNotification] = useState(false);
  const [hasOpenedNotification, setHasOpenedNotification] = useState(false);
  const [lastOpenedId, setLastOpenedId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handledResponseIdsRef = useRef<Set<string>>(new Set());
  const notificationsRef = useRef<PushNotificationRecord[]>(notifications);
  notificationsRef.current = notifications;

  const persistNotifications = useCallback(async (items: PushNotificationRecord[]) => {
    setNotifications(items);
    await LocalStorage.setObject(STORAGE_KEYS.LOCAL_PUSH_HISTORY, items);
  }, []);

  // Step 1: Initialize handler, Android channel, persisted push state & permission status
  useEffect(() => {
    let mounted = true;

    async function bootstrapNotifications() {
      configureNotificationHandler();
      await setupAndroidNotificationChannel();

      const [perm, savedDevice, savedToken, savedHistory] = await Promise.all([
        getNotificationPermissionStatus(),
        LocalStorage.getObject<RegisteredDevice>(STORAGE_KEYS.LOCAL_PUSH_DEVICE),
        LocalStorage.getItem(STORAGE_KEYS.LOCAL_PUSH_TOKEN),
        LocalStorage.getObject<PushNotificationRecord[]>(STORAGE_KEYS.LOCAL_PUSH_HISTORY),
      ]);

      if (!mounted) return;

      setPermissionStatus(perm);
      if (savedDevice) {
        setRegisteredDevice(savedDevice);
        setExpoPushToken(savedDevice.pushToken);
        setTokenType(savedDevice.tokenType);
      } else if (savedToken) {
        setExpoPushToken(savedToken);
        setTokenType(savedToken.includes('RuangKosDemo') ? 'preview' : 'expo');
      }

      if (savedHistory && savedHistory.length > 0) {
        setNotifications(savedHistory);
      }

      setAppInitialized(true);
    }

    void bootstrapNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  // Helper to mark notification opened and navigate (Step 7)
  const navigateFromNotificationRecord = useCallback(
    (record: PushNotificationRecord) => {
      const nowIso = new Date().toISOString();
      const updated = notificationsRef.current.map((item) =>
        item.id === record.id ? { ...item, isRead: true, tappedAt: nowIso } : item
      );
      void persistNotifications(updated);
      setHasOpenedNotification(true);
      setLastOpenedId(record.id);

      const destination = record.targetRoute || `/announcement/${record.id}`;
      router.push(destination as any);
    },
    [persistNotifications, router]
  );

  // Step 6 & Step 7: Native Notification Listeners
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content;
      const payload = (content.data || {}) as Record<string, any>;
      const announcementId =
        typeof payload.announcementId === 'string'
          ? payload.announcementId
          : `ann-${Date.now()}`;
      const category = (payload.category as NotificationCategory) || 'pengumuman';
      const targetRoute =
        typeof payload.targetRoute === 'string'
          ? payload.targetRoute
          : `/announcement/${announcementId}`;

      const existing = notificationsRef.current.find((n) => n.id === announcementId);
      if (!existing) {
        const incoming: PushNotificationRecord = {
          id: announcementId,
          title: content.title || 'Notifikasi RuangKos',
          subtitle: content.subtitle || undefined,
          body: content.body || 'Ada pembaruan jadwal kebersihan kos.',
          category,
          sender: typeof payload.sender === 'string' ? payload.sender : 'Server RuangKos',
          targetRoute,
          data: payload,
          deliveryChannel: 'local_notification',
          ticketStatus: 'ok',
          receivedAt: new Date().toISOString(),
          isRead: false,
        };
        void persistNotifications([incoming, ...notificationsRef.current.slice(0, 29)]);
      }

      setHasReceivedNotification(true);
      if (settings.hapticEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      triggerNotification(
        content.title || '🔔 Notifikasi RuangKos',
        content.body || 'Ketuk untuk membuka detail pengumuman.',
        {
          id: announcementId,
          targetRoute,
          category,
        }
      );
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const reqId = response.notification.request.identifier;
      if (handledResponseIdsRef.current.has(reqId)) return;
      handledResponseIdsRef.current.add(reqId);

      const content = response.notification.request.content;
      const payload = (content.data || {}) as Record<string, any>;
      const announcementId =
        typeof payload.announcementId === 'string'
          ? payload.announcementId
          : `ann-${Date.now()}`;
      const category = (payload.category as NotificationCategory) || 'pengumuman';
      const targetRoute =
        typeof payload.targetRoute === 'string'
          ? payload.targetRoute
          : `/announcement/${announcementId}`;

      let record = notificationsRef.current.find((n) => n.id === announcementId);
      if (!record) {
        record = {
          id: announcementId,
          title: content.title || 'Pengumuman RuangKos',
          subtitle: content.subtitle || undefined,
          body: content.body || 'Detail informasi kebersihan kos.',
          category,
          sender: typeof payload.sender === 'string' ? payload.sender : 'Server RuangKos',
          targetRoute,
          data: payload,
          deliveryChannel: 'local_notification',
          ticketStatus: 'ok',
          receivedAt: new Date().toISOString(),
          isRead: true,
          tappedAt: new Date().toISOString(),
        };
        void persistNotifications([record, ...notificationsRef.current.slice(0, 29)]);
      }

      setHasReceivedNotification(true);
      navigateFromNotificationRecord(record);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [navigateFromNotificationRecord, persistNotifications, settings.hapticEnabled, triggerNotification]);

  // Step 7 (Cold Start): Handle notification tap if app was launched from a closed state
  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (Platform.OS === 'web' || !lastNotificationResponse) return;
    const reqId = lastNotificationResponse.notification.request.identifier;
    if (handledResponseIdsRef.current.has(reqId)) return;
    handledResponseIdsRef.current.add(reqId);

    const content = lastNotificationResponse.notification.request.content;
    const payload = (content.data || {}) as Record<string, any>;
    const announcementId =
      typeof payload.announcementId === 'string'
        ? payload.announcementId
        : `ann-${Date.now()}`;
    const targetRoute =
      typeof payload.targetRoute === 'string'
        ? payload.targetRoute
        : `/announcement/${announcementId}`;
    const category = (payload.category as NotificationCategory) || 'pengumuman';

    const existing = notificationsRef.current.find((n) => n.id === announcementId);
    const record: PushNotificationRecord = existing || {
      id: announcementId,
      title: content.title || 'Pengumuman RuangKos',
      subtitle: content.subtitle || undefined,
      body: content.body || 'Detail notifikasi RuangKos.',
      category,
      sender: typeof payload.sender === 'string' ? payload.sender : 'Server RuangKos',
      targetRoute,
      data: payload,
      deliveryChannel: 'local_notification',
      receivedAt: new Date().toISOString(),
      isRead: true,
    };

    setHasReceivedNotification(true);
    navigateFromNotificationRecord(record);
  }, [lastNotificationResponse, navigateFromNotificationRecord]);

  const refreshPermissionStatus = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setPermissionStatus(status);
    return status;
  }, []);

  // Step 2: Request permission
  const requestPermission = useCallback(async () => {
    setIsBusy(true);
    try {
      const status = await requestNotificationPermission();
      setPermissionStatus(status);
      return status;
    } finally {
      setIsBusy(false);
    }
  }, []);

  const denyPermissionDemo = useCallback(() => {
    setPermissionStatus('denied');
  }, []);

  // Step 4: Fetch Push Token
  const fetchPushToken = useCallback(async () => {
    setIsBusy(true);
    try {
      const result = await acquireExpoPushToken();
      setExpoPushToken(result.token);
      setTokenType(result.tokenType);
      setTokenNote(result.note || null);
      await LocalStorage.setItem(STORAGE_KEYS.LOCAL_PUSH_TOKEN, result.token);
      return result.token;
    } finally {
      setIsBusy(false);
    }
  }, []);

  // Step 3: Register Device
  const registerDevice = useCallback(async () => {
    setIsBusy(true);
    try {
      let currentToken = expoPushToken;
      let currentTokenType = tokenType;

      if (!currentToken) {
        const result = await acquireExpoPushToken();
        currentToken = result.token;
        currentTokenType = result.tokenType;
        setExpoPushToken(result.token);
        setTokenType(result.tokenType);
        setTokenNote(result.note || null);
      }

      const deviceMeta = getDeviceMetadata();
      const apiRes = await ApiService.registerPushDevice(authJwtToken, {
        ...deviceMeta,
        pushToken: currentToken,
        tokenType: currentTokenType || 'preview',
        userId: user?.id || 'guest',
        kosName: user?.kosName || settings.kosName || 'RuangKos Melati 21',
      });

      if (apiRes.success && apiRes.data) {
        setRegisteredDevice(apiRes.data);
        return apiRes.data;
      }

      // Fallback local persistence if unauthenticated
      const localDevice: RegisteredDevice = {
        ...deviceMeta,
        pushToken: currentToken,
        tokenType: currentTokenType || 'preview',
        userId: user?.id || 'guest',
        kosName: user?.kosName || settings.kosName || 'RuangKos Melati 21',
        registeredAt: new Date().toISOString(),
      };
      await LocalStorage.setObject(STORAGE_KEYS.LOCAL_PUSH_DEVICE, localDevice);
      setRegisteredDevice(localDevice);
      return localDevice;
    } finally {
      setIsBusy(false);
    }
  }, [authJwtToken, expoPushToken, settings.kosName, tokenType, user?.id, user?.kosName]);

  // One-tap pipeline for Steps 2 -> 4 -> 3
  const setupPushPipeline = useCallback(async () => {
    const perm = await requestPermission();
    if (perm === 'denied') return false;
    await fetchPushToken();
    const device = await registerDevice();
    return !!device;
  }, [fetchPushToken, registerDevice, requestPermission]);

  // Step 5 & 6: Send Notification & Deliver to Device
  const sendPushNotification = useCallback(
    async (input: SendPushInput): Promise<PushNotificationRecord | null> => {
      setIsBusy(true);
      try {
        // Ensure token & device exist for seamless demo
        let activeToken = expoPushToken;
        let activeType = tokenType;
        if (!activeToken) {
          const tokenRes = await acquireExpoPushToken();
          activeToken = tokenRes.token;
          activeType = tokenRes.tokenType;
          setExpoPushToken(tokenRes.token);
          setTokenType(tokenRes.tokenType);
          setTokenNote(tokenRes.note || null);
        }

        const announcementId = `ann-${Date.now()}`;
        const targetRoute = input.targetRoute || `/announcement/${announcementId}`;
        const sender = user ? `${user.name} (${user.role})` : 'Ketua Kos RuangKos';

        const dataPayload: Record<string, unknown> = {
          announcementId,
          targetRoute,
          category: input.category,
          sender,
          kosName: user?.kosName || settings.kosName,
          sentAt: new Date().toISOString(),
        };

        const dispatchRes = await ApiService.sendPushNotification(authJwtToken, {
          to: activeToken,
          tokenType: activeType || 'preview',
          title: input.title,
          subtitle: input.subtitle,
          body: input.body,
          data: dataPayload,
        });

        const dispatchData = dispatchRes.data || {
          ticketId: `local-${Date.now()}`,
          ticketStatus: 'simulated' as const,
          deliveryChannel: 'local_notification' as const,
          providerNote: 'Dikirim melalui dispatcher lokal RuangKos.',
        };

        setLastDispatch({
          announcementId,
          ticketId: dispatchData.ticketId,
          ticketStatus: dispatchData.ticketStatus,
          deliveryChannel: dispatchData.deliveryChannel,
          providerNote: dispatchData.providerNote,
          sentAt: new Date().toISOString(),
        });

        const newRecord: PushNotificationRecord = {
          id: announcementId,
          title: input.title,
          subtitle: input.subtitle,
          body: input.body,
          category: input.category,
          sender,
          targetRoute,
          data: dataPayload,
          deliveryChannel: dispatchData.deliveryChannel,
          ticketId: dispatchData.ticketId,
          ticketStatus: dispatchData.ticketStatus,
          receivedAt: new Date().toISOString(),
          isRead: false,
        };

        const delay = input.delaySeconds ?? 0;

        // Save into inbox immediately if immediate, or on delivery
        const deliverNow = async () => {
          await persistNotifications([newRecord, ...notificationsRef.current.slice(0, 29)]);
          setHasReceivedNotification(true);
          if (settings.hapticEnabled) {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
          triggerNotification(input.title, input.body, {
            id: announcementId,
            targetRoute,
            category: input.category,
          });
        };

        if (Platform.OS === 'web') {
          if (delay > 0) {
            setTimeout(() => {
              void deliverNow();
            }, delay * 1000);
          } else {
            await deliverNow();
          }

          await presentLocalDeviceNotification({
            title: input.title,
            subtitle: input.subtitle,
            body: input.body,
            data: dataPayload,
            delaySeconds: delay,
            onWebTap: () => navigateFromNotificationRecord(newRecord),
          });
        } else {
          // On native (iOS / Android): save record & schedule local OS notification
          // unless real Expo Push API already pushed remotely (avoid duplicate if desired,
          // or schedule local notification if preview/fallback)
          await persistNotifications([newRecord, ...notificationsRef.current.slice(0, 29)]);
          if (dispatchData.deliveryChannel !== 'expo_push_api') {
            await presentLocalDeviceNotification({
              title: input.title,
              subtitle: input.subtitle,
              body: input.body,
              data: dataPayload,
              delaySeconds: delay,
            });
          } else {
            setHasReceivedNotification(true);
          }
        }

        return newRecord;
      } finally {
        setIsBusy(false);
      }
    },
    [
      authJwtToken,
      expoPushToken,
      navigateFromNotificationRecord,
      persistNotifications,
      settings.hapticEnabled,
      settings.kosName,
      tokenType,
      triggerNotification,
      user,
    ]
  );

  const openNotification = useCallback(
    (record: PushNotificationRecord) => {
      navigateFromNotificationRecord(record);
    },
    [navigateFromNotificationRecord]
  );

  const openNotificationById = useCallback(
    (id: string) => {
      const found = notificationsRef.current.find((n) => n.id === id);
      if (found) {
        navigateFromNotificationRecord(found);
      } else {
        setHasOpenedNotification(true);
        setLastOpenedId(id);
        router.push(`/announcement/${id}` as any);
      }
    },
    [navigateFromNotificationRecord, router]
  );

  const markAllAsRead = useCallback(async () => {
    const updated = notificationsRef.current.map((n) => ({ ...n, isRead: true }));
    await persistNotifications(updated);
  }, [persistNotifications]);

  const clearHistory = useCallback(async () => {
    await persistNotifications([]);
  }, [persistNotifications]);

  const resetDemoState = useCallback(async () => {
    setRegisteredDevice(null);
    setExpoPushToken(null);
    setTokenType(null);
    setTokenNote(null);
    setLastDispatch(null);
    setHasReceivedNotification(false);
    setHasOpenedNotification(false);
    setLastOpenedId(null);
    await LocalStorage.deleteItem(STORAGE_KEYS.LOCAL_PUSH_DEVICE);
    await LocalStorage.deleteItem(STORAGE_KEYS.LOCAL_PUSH_TOKEN);
    await persistNotifications(SEED_ANNOUNCEMENTS);
    const perm = await getNotificationPermissionStatus();
    setPermissionStatus(perm);
  }, [persistNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        appInitialized,
        permissionStatus,
        registeredDevice,
        expoPushToken,
        tokenType,
        tokenNote,
        lastDispatch,
        notifications,
        unreadCount,
        hasReceivedNotification,
        hasOpenedNotification,
        lastOpenedId,
        isBusy,
        refreshPermissionStatus,
        requestPermission,
        denyPermissionDemo,
        fetchPushToken,
        registerDevice,
        setupPushPipeline,
        sendPushNotification,
        openNotification,
        openNotificationById,
        markAllAsRead,
        clearHistory,
        resetDemoState,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};

