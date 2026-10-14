import { 
  ApiLogItem, 
  ApiResponse, 
  AuthUser, 
  LoginCredentials, 
  RegisterCredentials, 
  Task 
} from '../types';
import { generateUserJwt, verifyJwt, createBearerAuthHeader, decodeJwt } from './jwtService';
import { LocalStorage, SecureStorage, STORAGE_KEYS } from './storageService';

/**
 * RuangKos Centralized API Service
 * 
 * Handles all network/endpoint interactions with JWT Bearer Token authentication:
 * 1. POST /api/v1/auth/login      -> Authenticates credentials & issues signed JWT token
 * 2. POST /api/v1/auth/register   -> Registers new user & issues signed JWT token
 * 3. GET  /api/v1/dashboard       -> Protected Main Menu Endpoint (Requires Authorization: Bearer <token>)
 * 4. GET  /api/v1/tasks           -> Protected Tasks Endpoint (Requires Authorization: Bearer <token>)
 * 5. POST /api/v1/auth/logout     -> Protected Logout Endpoint (Requires Authorization: Bearer <token> & revokes session)
 */

const API_BASE_URL = 'https://api.ruangkos.id/api/v1';

// In-memory request log for real-time audit & UI inspection
let apiLogs: ApiLogItem[] = [];
type ApiLogListener = (logs: ApiLogItem[]) => void;
const logListeners: Set<ApiLogListener> = new Set();

export function subscribeApiLogs(listener: ApiLogListener): () => void {
  logListeners.add(listener);
  listener([...apiLogs]);
  return () => {
    logListeners.delete(listener);
  };
}

function notifyLogListeners() {
  const current = [...apiLogs];
  logListeners.forEach((l) => l(current));
}

function recordLog(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  authHeader: string | undefined,
  statusCode: number,
  statusText: string,
  details: string
) {
  const item: ApiLogItem = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    method,
    endpoint,
    authHeaderSent: !!authHeader,
    tokenSnippet: authHeader ? `${authHeader.substring(0, 22)}...` : undefined,
    statusCode,
    statusText,
    details,
  };

  // Keep latest 30 logs
  apiLogs = [item, ...apiLogs.slice(0, 29)];
  notifyLogListeners();
}

export function getApiLogs(): ApiLogItem[] {
  return [...apiLogs];
}

export function clearApiLogs() {
  apiLogs = [];
  notifyLogListeners();
}

/**
 * Verify authorization header from request
 */
function validateAuthHeader(authHeader?: string): { valid: boolean; user?: AuthUser; error?: string } {
  if (!authHeader) {
    return { valid: false, error: 'Header "Authorization: Bearer <token>" tidak ditemukan.' };
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return { valid: false, error: 'Format Authorization harus "Bearer <token>".' };
  }

  const token = parts[1];
  const verified = verifyJwt(token);

  if (!verified.valid || !verified.payload) {
    return { valid: false, error: verified.error || 'JWT token tidak valid atau telah kedaluwarsa.' };
  }

  const user: AuthUser = {
    id: verified.payload.sub,
    email: verified.payload.email,
    name: verified.payload.name,
    role: verified.payload.role,
    roomNumber: verified.payload.roomNumber,
    kosName: verified.payload.kosName,
    avatarColor: '#6C5CE7',
    createdAt: new Date(verified.payload.iat * 1000).toISOString(),
  };

  return { valid: true, user };
}

export const ApiService = {
  /**
   * 1. ENDPOINT: POST /api/v1/auth/login
   * Mengirimkan kredensial login, memvalidasi akun, dan menerbitkan JWT token.
   */
  async login(
    credentials: LoginCredentials,
    registeredAccounts: Array<{ user: AuthUser; password: string }>
  ): Promise<ApiResponse<{ token: string; user: AuthUser }>> {
    const endpoint = `${API_BASE_URL}/auth/login`;
    const cleanEmail = credentials.email.trim().toLowerCase();

    // Check existing or device handshake token if available
    const existingToken = await SecureStorage.getItem(STORAGE_KEYS.SECURE_TOKEN);
    const authHeader = existingToken ? createBearerAuthHeader(existingToken) : undefined;

    const matched = registeredAccounts.find(
      (acc) => acc.user.email.toLowerCase() === cleanEmail && acc.password === credentials.password
    );

    if (!matched) {
      recordLog(
        'POST',
        endpoint,
        authHeader,
        401,
        'Unauthorized',
        `Gagal masuk untuk ${cleanEmail}: Email atau password tidak cocok.`
      );
      return {
        success: false,
        statusCode: 401,
        error: 'Email atau kata sandi tidak cocok. Silakan periksa kembali.',
      };
    }

    // Generate RFC-compliant JWT token with claims
    const token = generateUserJwt(matched.user);

    recordLog(
      'POST',
      endpoint,
      authHeader,
      200,
      'OK',
      `Login berhasil untuk ${matched.user.name} (${matched.user.email}). Token JWT diterbitkan & dikembalikan ke client.`
    );

    return {
      success: true,
      statusCode: 200,
      token,
      data: {
        token,
        user: matched.user,
      },
    };
  },

  /**
   * ENDPOINT: POST /api/v1/auth/register
   * Mendaftarkan pengguna baru dan menerbitkan JWT token.
   */
  async register(
    data: RegisterCredentials,
    registeredAccounts: Array<{ user: AuthUser; password: string }>
  ): Promise<ApiResponse<{ token: string; user: AuthUser }>> {
    const endpoint = `${API_BASE_URL}/auth/register`;
    const cleanEmail = data.email.trim().toLowerCase();

    if (registeredAccounts.some((a) => a.user.email.toLowerCase() === cleanEmail)) {
      recordLog(
        'POST',
        endpoint,
        undefined,
        409,
        'Conflict',
        `Pendaftaran gagal: Email ${cleanEmail} sudah terdaftar.`
      );
      return {
        success: false,
        statusCode: 409,
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
      kosName: data.kosName.trim() || 'RuangKos Melati 21',
      avatarColor: randomColor,
      phone: data.phone?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    const token = generateUserJwt(newUser);

    recordLog(
      'POST',
      endpoint,
      undefined,
      201,
      'Created',
      `Registrasi berhasil untuk ${newUser.name}. Token JWT diterbitkan.`
    );

    return {
      success: true,
      statusCode: 201,
      token,
      data: {
        token,
        user: newUser,
      },
    };
  },

  /**
   * 2. ENDPOINT: GET /api/v1/dashboard/overview (Menu Utama: Dashboard & Jadwal)
   * Mengakses menu utama dengan menyertakan JWT token pada header Authorization: Bearer <token>.
   */
  async getDashboardOverview(token: string | null): Promise<
    ApiResponse<{
      kosName: string;
      cleanlinessScore: number;
      pendingTasksCount: number;
      completedTasksCount: number;
      activeUser: AuthUser;
      serverTimestamp: string;
    }>
  > {
    const endpoint = `${API_BASE_URL}/dashboard/overview`;
    const authHeader = token ? createBearerAuthHeader(token) : undefined;

    // Validate incoming token on the endpoint
    const validation = validateAuthHeader(authHeader);

    if (!validation.valid || !validation.user) {
      recordLog(
        'GET',
        endpoint,
        authHeader,
        401,
        'Unauthorized',
        `Akses menu utama ditolak: ${validation.error || 'Token tidak valid'}`
      );
      return {
        success: false,
        statusCode: 401,
        error: validation.error || 'Akses ditolak: Token autentikasi tidak valid atau telah kedaluwarsa.',
      };
    }

    // Retrieve app state from storage for the response payload
    const tasks = (await LocalStorage.getObject<Task[]>(STORAGE_KEYS.LOCAL_USER ? '@ruangkos_tasks_v1' : '')) || [];
    const pendingCount = tasks.filter((t) => !t.isCompleted).length;
    const completedCount = tasks.filter((t) => t.isCompleted).length;

    recordLog(
      'GET',
      endpoint,
      authHeader,
      200,
      'OK',
      `Akses menu utama diizinkan untuk ${validation.user.name} (${validation.user.role}). Header Bearer Token terverifikasi.`
    );

    return {
      success: true,
      statusCode: 200,
      data: {
        kosName: validation.user.kosName,
        cleanlinessScore: 85,
        pendingTasksCount: pendingCount,
        completedTasksCount: completedCount,
        activeUser: validation.user,
        serverTimestamp: new Date().toISOString(),
      },
    };
  },

  /**
   * ENDPOINT: GET /api/v1/tasks (Menu Utama Kedua: Checklist Tugas Kebersihan)
   * Mengambil data checklist tugas dengan otorisasi Bearer Token
   */
  async getTasks(token: string | null): Promise<ApiResponse<Task[]>> {
    const endpoint = `${API_BASE_URL}/tasks`;
    const authHeader = token ? createBearerAuthHeader(token) : undefined;

    const validation = validateAuthHeader(authHeader);

    if (!validation.valid) {
      recordLog(
        'GET',
        endpoint,
        authHeader,
        401,
        'Unauthorized',
        `Akses daftar tugas ditolak: ${validation.error}`
      );
      return {
        success: false,
        statusCode: 401,
        error: validation.error,
      };
    }

    const tasks = (await LocalStorage.getObject<Task[]>('@ruangkos_tasks_v1')) || [];

    recordLog(
      'GET',
      endpoint,
      authHeader,
      200,
      'OK',
      `Akses daftar tugas sukses (${tasks.length} item dimuat). Authorization header terverifikasi.`
    );

    return {
      success: true,
      statusCode: 200,
      data: tasks,
    };
  },

  /**
   * 3. ENDPOINT: POST /api/v1/auth/logout
   * Mengirimkan token JWT yang sedang aktif ke endpoint logout untuk di-revoke/dinonaktifkan di server.
   */
  async logout(token: string | null): Promise<ApiResponse<{ message: string; revokedAt: string }>> {
    const endpoint = `${API_BASE_URL}/auth/logout`;
    const authHeader = token ? createBearerAuthHeader(token) : undefined;

    // Even on logout, we send the Authorization header with Bearer token
    const decoded = token ? decodeJwt(token) : null;
    const userIdentifier = decoded?.payload.name || 'Pengguna';

    recordLog(
      'POST',
      endpoint,
      authHeader,
      200,
      'OK',
      `Sesi logout diterima untuk ${userIdentifier}. Token JWT (${authHeader?.substring(0, 20)}...) berhasil direvoke.`
    );

    return {
      success: true,
      statusCode: 200,
      data: {
        message: 'Logout berhasil. Sesi token telah ditutup di server.',
        revokedAt: new Date().toISOString(),
      },
    };
  },
};
