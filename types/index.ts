export type TaskCategory = 
  | 'kamar_mandi' 
  | 'dapur' 
  | 'ruang_tamu' 
  | 'sampah' 
  | 'halaman' 
  | 'lainnya';

export type TaskPriority = 'Tinggi' | 'Sedang' | 'Rendah';

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu' | 'Setiap Hari';

export interface Roommate {
  id: string;
  name: string;
  role: 'Ketua Kos' | 'Penghuni';
  avatarColor: string;
  phone?: string;
  score: number;
  tasksCompletedCount: number;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  assignedRoommateId: string;
  assignedDay: DayOfWeek;
  time: string; // HH:mm
  priority: TaskPriority;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface HistoryItem {
  id: string;
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  completedByRoommateName: string;
  completedAt: string;
  pointsEarned: number;
}

export interface AppSettings {
  reminderEnabled: boolean;
  reminderTime: string; // e.g. "07:00"
  soundEnabled: boolean;
  hapticEnabled: boolean;
  autoRotateWeekly: boolean;
  kosName: string;
  roomNumber: string;
}
