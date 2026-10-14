import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthUser, StorageAuditItem } from '../types';

/**
 * Storage Architecture for RuangKos:
 * 
 * 1. SECURE STORAGE (expo-secure-store):
 *    - Hardware-backed on mobile (iOS Keychain / Android Keystore).
 *    - Stores sensitive data: Auth Bearer Tokens, Session Keys, Encrypted Credentials.
 * 
 * 2. LOCAL STORAGE (AsyncStorage):
 *    - Unencrypted key-value store for app state, cache, & non-sensitive preferences.
 *    - Stores: User Profile, Remember Me Email, Registered Accounts, Offline tasks.
 */

export const STORAGE_KEYS = {
  // --- Secure Storage Keys (Sensitive) ---
  SECURE_TOKEN: 'ruangkos_auth_token_v1',
  SECURE_CREDENTIALS: 'ruangkos_auth_credentials_v1',
  SECURE_SESSION_ID: 'ruangkos_session_id_v1',

  // --- Local Storage Keys (AsyncStorage) ---
  LOCAL_USER: '@ruangkos_active_user_v1',
  LOCAL_REMEMBER_EMAIL: '@ruangkos_remember_email_v1',
  LOCAL_REGISTERED_USERS: '@ruangkos_registered_accounts_v1',
  LOCAL_AUTH_LOGS: '@ruangkos_auth_logs_v1',
};

// Check if SecureStore is natively supported on current platform
const isWeb = Platform.OS === 'web';

/**
 * SECURE STORAGE ADAPTER
 * Interacts with expo-secure-store with safe fallback for web platform
 */
export const SecureStorage = {
  /**
   * Store a sensitive string securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        // Fallback for web development environment
        localStorage.setItem(`__secure_${key}`, btoa(value));
      } else {
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      }
    } catch (err) {
      console.warn(`[SecureStore] Error writing key ${key}:`, err);
    }
  },

  /**
   * Retrieve a sensitive string securely
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        const val = localStorage.getItem(`__secure_${key}`);
        return val ? atob(val) : null;
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (err) {
      console.warn(`[SecureStore] Error reading key ${key}:`, err);
      return null;
    }
  },

  /**
   * Delete a sensitive key securely
   */
  async deleteItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.removeItem(`__secure_${key}`);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (err) {
      console.warn(`[SecureStore] Error deleting key ${key}:`, err);
    }
  },
};

/**
 * LOCAL STORAGE ADAPTER
 * Interacts with @react-native-async-storage/async-storage for general app data
 */
export const LocalStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[LocalStorage] Error writing key ${key}:`, err);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      console.warn(`[LocalStorage] Error reading key ${key}:`, err);
      return null;
    }
  },

  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const json = JSON.stringify(value);
      await AsyncStorage.setItem(key, json);
    } catch (err) {
      console.warn(`[LocalStorage] Error writing object to key ${key}:`, err);
    }
  },

  async getObject<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn(`[LocalStorage] Error parsing object from key ${key}:`, err);
      return null;
    }
  },

  async deleteItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.warn(`[LocalStorage] Error deleting key ${key}:`, err);
    }
  },
};

/**
 * Live Storage Audit Inspector
 * Provides transparent view of what is in SecureStore vs AsyncStorage
 */
export async function getStorageAudit(): Promise<StorageAuditItem[]> {
  const audit: StorageAuditItem[] = [];

  // 1. Audit SecureStore
  const token = await SecureStorage.getItem(STORAGE_KEYS.SECURE_TOKEN);
  audit.push({
    key: STORAGE_KEYS.SECURE_TOKEN,
    storageType: 'Expo SecureStore',
    isEncrypted: true,
    description: 'Hardware Encrypted Auth Bearer Token (Keychain/Keystore)',
    exists: !!token,
    preview: token ? `${token.substring(0, 16)}... (Encrypted)` : 'Belum tersimpan',
  });

  const creds = await SecureStorage.getItem(STORAGE_KEYS.SECURE_CREDENTIALS);
  audit.push({
    key: STORAGE_KEYS.SECURE_CREDENTIALS,
    storageType: 'Expo SecureStore',
    isEncrypted: true,
    description: 'Kredensial Login & Hash Password Terenkripsi',
    exists: !!creds,
    preview: creds ? '•••••••••••••••• (Protected)' : 'Belum tersimpan',
  });

  const sessionId = await SecureStorage.getItem(STORAGE_KEYS.SECURE_SESSION_ID);
  audit.push({
    key: STORAGE_KEYS.SECURE_SESSION_ID,
    storageType: 'Expo SecureStore',
    isEncrypted: true,
    description: 'Device Cryptographic Session Identifier',
    exists: !!sessionId,
    preview: sessionId ? `${sessionId.substring(0, 12)}...` : 'Belum tersimpan',
  });

  // 2. Audit AsyncStorage
  const user = await LocalStorage.getObject<AuthUser>(STORAGE_KEYS.LOCAL_USER);
  audit.push({
    key: STORAGE_KEYS.LOCAL_USER,
    storageType: 'AsyncStorage',
    isEncrypted: false,
    description: 'Data Profil Pengguna Aktif (Nama, Kamar, Peran, Kos)',
    exists: !!user,
    preview: user ? `${user.name} (${user.role} - ${user.roomNumber})` : 'Belum ada pengguna aktif',
  });

  const rememberEmail = await LocalStorage.getItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL);
  audit.push({
    key: STORAGE_KEYS.LOCAL_REMEMBER_EMAIL,
    storageType: 'AsyncStorage',
    isEncrypted: false,
    description: 'Preferensi Ingat Email Pengguna (Form Auto-fill)',
    exists: !!rememberEmail,
    preview: rememberEmail || 'Tidak diaktifkan',
  });

  const regUsers = await LocalStorage.getObject<any[]>(STORAGE_KEYS.LOCAL_REGISTERED_USERS);
  audit.push({
    key: STORAGE_KEYS.LOCAL_REGISTERED_USERS,
    storageType: 'AsyncStorage',
    isEncrypted: false,
    description: 'Daftar Akun Terdaftar di Aplikasi (Offline Persistence)',
    exists: !!regUsers && regUsers.length > 0,
    preview: regUsers ? `${regUsers.length} akun terdaftar` : '0 akun',
  });

  return audit;
}
