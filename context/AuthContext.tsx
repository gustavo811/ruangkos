import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { AuthUser, LoginCredentials, RegisterCredentials, StorageAuditItem } from '../types';
import { SecureStorage, LocalStorage, STORAGE_KEYS, getStorageAudit } from '../services/storageService';

// Default initial accounts for testing / evaluation
export const DEMO_ACCOUNTS = [
  {
    user: {
      id: 'user-budi',
      name: 'Budi Santoso',
      email: 'budi@ruangkos.id',
      role: 'Ketua Kos' as const,
      roomNumber: 'Kamar 101',
      kosName: 'RuangKos Melati 21',
      avatarColor: '#6C5CE7',
      phone: '081234567890',
      createdAt: '2026-09-01T00:00:00.000Z',
    },
    password: 'password123',
  },
  {
    user: {
      id: 'user-agus',
      name: 'Agus Pratama',
      email: 'agus@ruangkos.id',
      role: 'Penghuni' as const,
      roomNumber: 'Kamar 102',
      kosName: 'RuangKos Melati 21',
      avatarColor: '#00B894',
      phone: '082198765432',
      createdAt: '2026-09-05T00:00:00.000Z',
    },
    password: 'password123',
  },
  {
    user: {
      id: 'user-siti',
      name: 'Siti Rahma',
      email: 'siti@ruangkos.id',
      role: 'Penghuni' as const,
      roomNumber: 'Kamar 203',
      kosName: 'RuangKos Melati 21',
      avatarColor: '#FF7675',
      phone: '085711223344',
      createdAt: '2026-09-10T00:00:00.000Z',
    },
    password: 'password123',
  },
];

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  rememberedEmail: string;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  quickLogin: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshSecurityAudit: () => Promise<StorageAuditItem[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rememberedEmail, setRememberedEmail] = useState<string>('');

  // Initial Bootstrap: Load token from SecureStore and user from LocalStorage
  useEffect(() => {
    bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    try {
      // 1. Initialize registered users database if not existing
      const existingAccounts = await LocalStorage.getObject<any[]>(STORAGE_KEYS.LOCAL_REGISTERED_USERS);
      if (!existingAccounts || existingAccounts.length === 0) {
        await LocalStorage.setObject(STORAGE_KEYS.LOCAL_REGISTERED_USERS, DEMO_ACCOUNTS);
      }

      // 2. Load remembered email from LocalStorage
      const savedEmail = await LocalStorage.getItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL);
      if (savedEmail) {
        setRememberedEmail(savedEmail);
      }

      // 3. Read Secure Token from Expo SecureStore
      const secureToken = await SecureStorage.getItem(STORAGE_KEYS.SECURE_TOKEN);
      
      // 4. Read User Profile from LocalStorage (AsyncStorage)
      const storedUser = await LocalStorage.getObject<AuthUser>(STORAGE_KEYS.LOCAL_USER);

      if (secureToken && storedUser) {
        setToken(secureToken);
        setUser(storedUser);
      } else {
        // Not authenticated
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('[AuthProvider] Bootstrap error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper to trigger haptics
   */
  const triggerHaptic = (type: 'success' | 'warning' | 'error') => {
    try {
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      // Safe fallback
    }
  };

  /**
   * Login Handler
   */
  const login = async ({ email, password, rememberMe = true }: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const accounts = (await LocalStorage.getObject<any[]>(STORAGE_KEYS.LOCAL_REGISTERED_USERS)) || DEMO_ACCOUNTS;

      const found = accounts.find(
        acc => acc.user.email.toLowerCase() === cleanEmail && acc.password === password
      );

      if (!found) {
        triggerHaptic('error');
        return { success: false, error: 'Email atau kata sandi tidak cocok. Silakan periksa kembali.' };
      }

      // Generate Secure Bearer Token
      const generatedToken = `rk_sec_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 1. SAVE SENSITIVE DATA IN SECURE STORE (expo-secure-store)
      await SecureStorage.setItem(STORAGE_KEYS.SECURE_TOKEN, generatedToken);
      await SecureStorage.setItem(STORAGE_KEYS.SECURE_SESSION_ID, sessionId);
      await SecureStorage.setItem(
        STORAGE_KEYS.SECURE_CREDENTIALS,
        JSON.stringify({ email: cleanEmail, timestamp: Date.now() })
      );

      // 2. SAVE NON-SENSITIVE DATA IN LOCAL STORAGE (AsyncStorage)
      await LocalStorage.setObject(STORAGE_KEYS.LOCAL_USER, found.user);

      if (rememberMe) {
        await LocalStorage.setItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL, cleanEmail);
        setRememberedEmail(cleanEmail);
      } else {
        await LocalStorage.deleteItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL);
        setRememberedEmail('');
      }

      setUser(found.user);
      setToken(generatedToken);
      triggerHaptic('success');
      return { success: true };
    } catch (err: any) {
      console.error('[AuthProvider] Login error:', err);
      triggerHaptic('error');
      return { success: false, error: err?.message || 'Terjadi kesalahan saat masuk' };
    }
  };

  /**
   * Register Handler
   */
  const register = async (data: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = data.email.trim().toLowerCase();
      const accounts = (await LocalStorage.getObject<any[]>(STORAGE_KEYS.LOCAL_REGISTERED_USERS)) || DEMO_ACCOUNTS;

      // Check if email already registered
      if (accounts.some(acc => acc.user.email.toLowerCase() === cleanEmail)) {
        triggerHaptic('warning');
        return { success: false, error: 'Email ini sudah terdaftar. Silakan masuk menggunakan akun tersebut.' };
      }

      const avatarColors = ['#6C5CE7', '#00B894', '#FF7675', '#0984E3', '#FDCB6E', '#10B981'];
      const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

      const newUser: AuthUser = {
        id: `user-${Date.now()}`,
        name: data.name.trim(),
        email: cleanEmail,
        role: data.role,
        roomNumber: data.roomNumber.trim() || 'Kamar Baru',
        kosName: data.kosName.trim() || 'RuangKos',
        avatarColor: randomColor,
        phone: data.phone?.trim() || '',
        createdAt: new Date().toISOString(),
      };

      const newAccountEntry = {
        user: newUser,
        password: data.password,
      };

      // 1. Update Registered Users in LocalStorage
      const updatedAccounts = [...accounts, newAccountEntry];
      await LocalStorage.setObject(STORAGE_KEYS.LOCAL_REGISTERED_USERS, updatedAccounts);

      // 2. Automatically Log in with Secure Token Generation
      const generatedToken = `rk_sec_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Save sensitive token in SecureStore
      await SecureStorage.setItem(STORAGE_KEYS.SECURE_TOKEN, generatedToken);
      await SecureStorage.setItem(STORAGE_KEYS.SECURE_SESSION_ID, sessionId);
      await SecureStorage.setItem(
        STORAGE_KEYS.SECURE_CREDENTIALS,
        JSON.stringify({ email: cleanEmail, timestamp: Date.now() })
      );

      // Save user profile in LocalStorage
      await LocalStorage.setObject(STORAGE_KEYS.LOCAL_USER, newUser);
      await LocalStorage.setItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL, cleanEmail);

      setUser(newUser);
      setToken(generatedToken);
      setRememberedEmail(cleanEmail);
      triggerHaptic('success');
      return { success: true };
    } catch (err: any) {
      console.error('[AuthProvider] Register error:', err);
      triggerHaptic('error');
      return { success: false, error: err?.message || 'Gagal mendaftar akun baru' };
    }
  };

  /**
   * 1-Tap Quick Login for Demo Testing
   */
  const quickLogin = async (email: string) => {
    return login({ email, password: 'password123', rememberMe: true });
  };

  /**
   * Logout Handler
   * Securely purges hardware encrypted tokens while maintaining general preferences
   */
  const logout = async () => {
    try {
      // 1. Wipe Secure Store keys
      await SecureStorage.deleteItem(STORAGE_KEYS.SECURE_TOKEN);
      await SecureStorage.deleteItem(STORAGE_KEYS.SECURE_CREDENTIALS);
      await SecureStorage.deleteItem(STORAGE_KEYS.SECURE_SESSION_ID);

      // 2. Wipe Active User Profile from Local Storage
      await LocalStorage.deleteItem(STORAGE_KEYS.LOCAL_USER);

      setUser(null);
      setToken(null);
      triggerHaptic('success');
    } catch (err) {
      console.error('[AuthProvider] Logout error:', err);
    }
  };

  /**
   * Retrieve live security and storage audit info
   */
  const refreshSecurityAudit = async (): Promise<StorageAuditItem[]> => {
    return await getStorageAudit();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        rememberedEmail,
        login,
        register,
        logout,
        quickLogin,
        refreshSecurityAudit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
