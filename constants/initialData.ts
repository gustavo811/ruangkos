import { Roommate, Task, HistoryItem, AppSettings } from '../types';

export const INITIAL_ROOMMATES: Roommate[] = [
  {
    id: 'roommate-1',
    name: 'Budi Santoso',
    role: 'Ketua Kos',
    avatarColor: '#6C5CE7',
    phone: '081234567890',
    score: 120,
    tasksCompletedCount: 12,
  },
  {
    id: 'roommate-2',
    name: 'Agus Pratama',
    role: 'Penghuni',
    avatarColor: '#00B894',
    phone: '082198765432',
    score: 95,
    tasksCompletedCount: 9,
  },
  {
    id: 'roommate-3',
    name: 'Siti Rahma',
    role: 'Penghuni',
    avatarColor: '#FF7675',
    phone: '085711223344',
    score: 110,
    tasksCompletedCount: 11,
  },
  {
    id: 'roommate-4',
    name: 'Rian Hidayat',
    role: 'Penghuni',
    avatarColor: '#0984E3',
    phone: '089644332211',
    score: 80,
    tasksCompletedCount: 8,
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Menyapu & Mengepel Koridor Kos',
    category: 'ruang_tamu',
    assignedRoommateId: 'roommate-2', // Agus
    assignedDay: 'Senin',
    time: '07:00',
    priority: 'Tinggi',
    isCompleted: true,
    completedAt: '2026-09-28T07:15:00.000Z',
    completedBy: 'Agus Pratama',
    notes: 'Sapuan harus bersih sampai ujung tangga.',
  },
  {
    id: 'task-2',
    title: 'Membuang Sampah Depan Kos',
    category: 'sampah',
    assignedRoommateId: 'roommate-1', // Budi
    assignedDay: 'Setiap Hari',
    time: '08:00',
    priority: 'Sedang',
    isCompleted: false,
    notes: 'Keluarkan ke tong sampah utama sebelum truk sampah lewat.',
  },
  {
    id: 'task-3',
    title: 'Membersihkan Kamar Mandi Utama',
    category: 'kamar_mandi',
    assignedRoommateId: 'roommate-3', // Siti
    assignedDay: 'Selasa',
    time: '16:30',
    priority: 'Tinggi',
    isCompleted: false,
    notes: 'Sikat bak mandi & siram karbol wangi lavender.',
  },
  {
    id: 'task-4',
    title: 'Cuci Piring & Lap Meja Dapur',
    category: 'dapur',
    assignedRoommateId: 'roommate-4', // Rian
    assignedDay: 'Rabu',
    time: '18:00',
    priority: 'Sedang',
    isCompleted: false,
    notes: 'Ganti spons cuci piring jika sudah kusam.',
  },
  {
    id: 'task-5',
    title: 'Mengepel Ruang Tamu & Teras',
    category: 'ruang_tamu',
    assignedRoommateId: 'roommate-1', // Budi
    assignedDay: 'Kamis',
    time: '07:30',
    priority: 'Sedang',
    isCompleted: false,
    notes: 'Gunakan pembersih lantai aroma jeruk nipis.',
  },
  {
    id: 'task-6',
    title: 'Membersihkan Halaman & Pot Bunga',
    category: 'halaman',
    assignedRoommateId: 'roommate-2', // Agus
    assignedDay: 'Jumat',
    time: '16:00',
    priority: 'Rendah',
    isCompleted: false,
    notes: 'Siram tanaman dan sapu daun kering.',
  },
  {
    id: 'task-7',
    title: 'Kerja Bakti Bersih Kos Total',
    category: 'ruang_tamu',
    assignedRoommateId: 'roommate-3', // Siti
    assignedDay: 'Sabtu',
    time: '09:00',
    priority: 'Tinggi',
    isCompleted: false,
    notes: 'Semua anak kos wajib ikut merapikan dapur dan kulkas bersama.',
  },
];

export const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: 'hist-1',
    taskId: 'task-101',
    taskTitle: 'Membuang Sampah Dapur',
    category: 'sampah',
    completedByRoommateName: 'Budi Santoso',
    completedAt: '2026-09-29T08:05:00.000Z',
    pointsEarned: 10,
  },
  {
    id: 'hist-2',
    taskId: 'task-102',
    taskTitle: 'Sikat Wastafel & Kaca Dapur',
    category: 'dapur',
    completedByRoommateName: 'Siti Rahma',
    completedAt: '2026-09-29T17:20:00.000Z',
    pointsEarned: 15,
  },
  {
    id: 'hist-3',
    taskId: 'task-103',
    taskTitle: 'Mengepel Ruang Makan',
    category: 'ruang_tamu',
    completedByRoommateName: 'Agus Pratama',
    completedAt: '2026-09-28T19:00:00.000Z',
    pointsEarned: 10,
  },
];

export const INITIAL_SETTINGS: AppSettings = {
  reminderEnabled: true,
  reminderTime: '07:00',
  soundEnabled: true,
  hapticEnabled: true,
  autoRotateWeekly: true,
  kosName: 'RuangKos Melati 21',
  roomNumber: 'Kamar 204',
};
