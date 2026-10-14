import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { AuthUser, JwtPayload, LoginCredentials, RegisterCredentials, StorageAuditItem } from '../types';
import { SecureStorage, LocalStorage, STORAGE_KEYS, getStorageAudit } from '../services/storageService';
import { ApiService } from '../services/apiService';
import { decodeJwt, verifyJwt } from '../services/jwtService';

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
  decodedToken: JwtPayload | null;
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

      // Validasi token JWT yang tersimpan
      if (secureToken && storedUser) {
        const verification = verifyJwt(secureToken);
        if (verification.valid) {
          setToken(secureToken);
          setUser(storedUser);
        } else {
          // Token kedaluwarsa atau tidak valid -> Bersihkan dari penyimpanan lokal
          console.warn('[AuthProvider] Token JWT tersimpan tidak valid atau expired. Membersihkan sesi.');
          await SecureStorage.deleteItem(STORAGE_KEYS.SECURE_TOKEN);
          await LocalStorage.deleteItem(STORAGE_KEYS.LOCAL_USER);
          setToken(null);
          setUser(null);
        }
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

  /**
   * Ketentuan 1: Saat login, aplikasi harus berhasil mendapatkan token dan menyimpannya.
   */
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

      // Akses Endpoint POST /api/v1/auth/login untuk autentikasi dan penerbitan JWT Token
      const apiRes = await ApiService.login({ email: cleanEmail, password, rememberMe }, accounts);

      if (!apiRes.success || !apiRes.token || !apiRes.data) {
        triggerHaptic('error');
        return { 
          success: false, 
          error: apiRes.error || 'Email atau kata sandi tidak cocok. Silakan periksa kembali.' 
        };
      }

      const jwtToken = apiRes.token;
      const authenticatedUser = apiRes.data.user;

      // SIMPAN TOKEN KE DALAM PENYIMPANAN AMAN (Hardware-encrypted SecureStore)
      await SecureStorage.setItem(STORAGE_KEYS.SECURE_TOKEN, jwtToken);
      await SecureStorage.setItem(
        STORAGE_KEYS.SECURE_CREDENTIALS,
        JSON.stringify({ email: cleanEmail, timestamp: Date.now() }),
      );
      await LocalStorage.setObject(STORAGE_KEYS.LOCAL_USER, authenticatedUser);

      if (rememberMe) {
        await LocalStorage.setItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL, cleanEmail);
        setRememberedEmail(cleanEmail);
      } else {
        await LocalStorage.deleteItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL);
        setRememberedEmail('');
      }

      setUser(authenticatedUser);
      setToken(jwtToken);
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

      // Akses Endpoint POST /api/v1/auth/register
      const apiRes = await ApiService.register(data, accounts);

      if (!apiRes.success || !apiRes.token || !apiRes.data) {
        triggerHaptic('warning');
        return {
          success: false,
          error: apiRes.error || 'Gagal mendaftar akun baru',
        };
      }

      const jwtToken = apiRes.token;
      const newUser = apiRes.data.user;

      const updatedAccounts = [...accounts, { user: newUser, password: data.password }];
      await LocalStorage.setObject(STORAGE_KEYS.LOCAL_REGISTERED_USERS, updatedAccounts);

      // Simpan JWT Token dan Data Pengguna ke SecureStorage & LocalStorage
      await SecureStorage.setItem(STORAGE_KEYS.SECURE_TOKEN, jwtToken);
      await SecureStorage.setItem(
        STORAGE_KEYS.SECURE_CREDENTIALS,
        JSON.stringify({ email: cleanEmail, timestamp: Date.now() }),
      );
      await LocalStorage.setObject(STORAGE_KEYS.LOCAL_USER, newUser);
      await LocalStorage.setItem(STORAGE_KEYS.LOCAL_REMEMBER_EMAIL, cleanEmail);

      setUser(newUser);
      setToken(jwtToken);
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

  /**
   * Ketentuan 2 & 3:
   * 2. Token dikirimkan ke endpoint logout (Authorization: Bearer <token>)
   * 3. Saat logout, token harus direfresh/dihapus dari penyimpanan lokal
   */
  const logout = async () => {
    try {
      const currentToken = token || (await SecureStorage.getItem(STORAGE_KEYS.SECURE_TOKEN));
      
      // Kirim token ke endpoint logout (revokasi sesi di server)
      await ApiService.logout(currentToken);

      // Hapus token dan data sesi dari penyimpanan lokal (SecureStore & AsyncStorage)
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

  const decodedToken = token ? decodeJwt(token)?.payload || null : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        decodedToken,
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
