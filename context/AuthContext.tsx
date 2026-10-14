import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { AuthUser, LoginCredentials, RegisterCredentials, StorageAuditItem } from '../types';
import { SecureStorage, LocalStorage, STORAGE_KEYS, getStorageAudit } from '../services/storageService';

export const DEMO_ACCOUNTS = [
  {
    user: {
      id: 'user-erling',
      name: 'Erling Rascals',
      email: 'erling@ruangkos.id',
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
      id: 'user-rex',
      name: 'Rex',
      email: 'rex@ruangkos.id',
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
      id: 'user-fiona',
      name: 'Fiona',
      email: 'fiona@ruangkos.id',
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
  const [isLoading, setIsLoading] = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState('');

  useEffect(() => {
    void bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    try {
      const existingAccounts = await LocalStorage.getObject<any[]>(
        STORAGE_KEYS.LOCAL_REGISTERED_USERS,
      );
      const customAccounts = (existingAccounts || []).filter(
        (account) => ![
          'user-budi',
          'user-agus',
          'user-siti',
          'user-erling',
          'user-rex',
          'user-fiona',
        ].includes(account.user.id),
      );
      await LocalStorage.setObject(
        STORAGE_KEYS.LOCAL_REGISTERED_USERS,
        [...DEMO_ACCOUNTS, ...customAccounts],
      );

      let savedEmail = await LocalStorage.getItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL);
      if (savedEmail === 'budi@ruangkos.id') savedEmail = 'erling@ruangkos.id';
      if (savedEmail === 'agus@ruangkos.id') savedEmail = 'rex@ruangkos.id';
      if (savedEmail === 'siti@ruangkos.id') savedEmail = 'fiona@ruangkos.id';
      if (savedEmail) {
        await LocalStorage.setItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL, savedEmail);
        setRememberedEmail(savedEmail);
      }

      const secureToken = await SecureStorage.getItem(STORAGE_KEYS.SECURE_TOKEN);
      let storedUser = await LocalStorage.getObject<AuthUser>(STORAGE_KEYS.LOCAL_USER);
      if (storedUser) {
        if (storedUser.email === 'budi@ruangkos.id' || storedUser.id === 'user-budi') {
          storedUser = DEMO_ACCOUNTS[0].user;
          await LocalStorage.setObject(STORAGE_KEYS.LOCAL_USER, storedUser);
        } else if (storedUser.email === 'agus@ruangkos.id' || storedUser.id === 'user-agus') {
          storedUser = DEMO_ACCOUNTS[1].user;
          await LocalStorage.setObject(STORAGE_KEYS.LOCAL_USER, storedUser);
        } else if (storedUser.email === 'siti@ruangkos.id' || storedUser.id === 'user-siti') {
          storedUser = DEMO_ACCOUNTS[2].user;
          await LocalStorage.setObject(STORAGE_KEYS.LOCAL_USER, storedUser);
        }
      }

      if (secureToken && storedUser) {
        setToken(secureToken);
        setUser(storedUser);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthProvider] Bootstrap error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerHaptic = (type: 'success' | 'warning' | 'error') => {
    try {
      if (type === 'success') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'warning') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      // Haptics are optional on unsupported platforms.
    }
  };

  const login = async ({
    email,
    password,
    rememberMe = true,
  }: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const accounts =
        (await LocalStorage.getObject<any[]>(STORAGE_KEYS.LOCAL_REGISTERED_USERS)) ||
        DEMO_ACCOUNTS;
      const found = accounts.find(
        (account) =>
          account.user.email.toLowerCase() === cleanEmail && account.password === password,
      );

      if (!found) {
        triggerHaptic('error');
        return { success: false, error: 'Email atau kata sandi tidak cocok. Silakan periksa kembali.' };
      }

      const generatedToken = `rk_sec_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await SecureStorage.setItem(STORAGE_KEYS.SECURE_TOKEN, generatedToken);
      await SecureStorage.setItem(STORAGE_KEYS.SECURE_SESSION_ID, sessionId);
      await SecureStorage.setItem(
        STORAGE_KEYS.SECURE_CREDENTIALS,
        JSON.stringify({ email: cleanEmail, timestamp: Date.now() }),
      );
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
    } catch (error) {
      console.error('[AuthProvider] Login error:', error);
      triggerHaptic('error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan saat masuk',
      };
    }
  };

  const register = async (
    data: RegisterCredentials,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = data.email.trim().toLowerCase();
      const accounts =
        (await LocalStorage.getObject<any[]>(STORAGE_KEYS.LOCAL_REGISTERED_USERS)) ||
        DEMO_ACCOUNTS;

      if (accounts.some((account) => account.user.email.toLowerCase() === cleanEmail)) {
        triggerHaptic('warning');
        return {
          success: false,
          error: 'Email ini sudah terdaftar. Silakan masuk menggunakan akun tersebut.',
        };
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
      const updatedAccounts = [...accounts, { user: newUser, password: data.password }];
      await LocalStorage.setObject(STORAGE_KEYS.LOCAL_REGISTERED_USERS, updatedAccounts);

      const generatedToken = `rk_sec_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      await SecureStorage.setItem(STORAGE_KEYS.SECURE_TOKEN, generatedToken);
      await SecureStorage.setItem(STORAGE_KEYS.SECURE_SESSION_ID, sessionId);
      await SecureStorage.setItem(
        STORAGE_KEYS.SECURE_CREDENTIALS,
        JSON.stringify({ email: cleanEmail, timestamp: Date.now() }),
      );
      await LocalStorage.setObject(STORAGE_KEYS.LOCAL_USER, newUser);
      await LocalStorage.setItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL, cleanEmail);

      setUser(newUser);
      setToken(generatedToken);
      setRememberedEmail(cleanEmail);
      triggerHaptic('success');
      return { success: true };
    } catch (error) {
      console.error('[AuthProvider] Register error:', error);
      triggerHaptic('error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal mendaftar akun baru',
      };
    }
  };

  const quickLogin = async (email: string) =>
    login({ email, password: 'password123', rememberMe: true });

  const logout = async () => {
    try {
      await SecureStorage.deleteItem(STORAGE_KEYS.SECURE_TOKEN);
      await SecureStorage.deleteItem(STORAGE_KEYS.SECURE_CREDENTIALS);
      await SecureStorage.deleteItem(STORAGE_KEYS.SECURE_SESSION_ID);
      await LocalStorage.deleteItem(STORAGE_KEYS.LOCAL_USER);
      setUser(null);
      setToken(null);
      triggerHaptic('success');
    } catch (error) {
      console.error('[AuthProvider] Logout error:', error);
    }
  };

  const refreshSecurityAudit = async (): Promise<StorageAuditItem[]> => getStorageAudit();

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
