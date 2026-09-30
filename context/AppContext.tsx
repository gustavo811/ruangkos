import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Task, Roommate, HistoryItem, AppSettings, DayOfWeek } from '../types';
import { 
  INITIAL_ROOMMATES, 
  INITIAL_TASKS, 
  INITIAL_HISTORY, 
  INITIAL_SETTINGS 
} from '../constants/initialData';

interface AppContextType {
  tasks: Task[];
  roommates: Roommate[];
  history: HistoryItem[];
  settings: AppSettings;
  activeNotification: { title: string; message: string; visible: boolean } | null;
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'isCompleted'>) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  editTask: (task: Task) => Promise<void>;

  // Roommate Actions
  addRoommate: (roommate: Omit<Roommate, 'id' | 'score' | 'tasksCompletedCount'>) => Promise<void>;
  deleteRoommate: (id: string) => Promise<void>;

  // Schedule Actions
  rotateWeeklySchedule: () => Promise<void>;

  // Notification Simulation Actions
  triggerNotification: (title: string, message: string) => void;
  dismissNotification: () => void;

  // Settings Actions
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetToDefaultData: () => Promise<void>;

  // Stats
  cleanlinessScore: number;
}

const STORAGE_KEYS = {
  TASKS: '@ruangkos_tasks_v1',
  ROOMMATES: '@ruangkos_roommates_v1',
  HISTORY: '@ruangkos_history_v1',
  SETTINGS: '@ruangkos_settings_v1',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [activeNotification, setActiveNotification] = useState<{ title: string; message: string; visible: boolean } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      const roommatesJson = await AsyncStorage.getItem(STORAGE_KEYS.ROOMMATES);
      const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (tasksJson) setTasks(JSON.parse(tasksJson));
      else setTasks(INITIAL_TASKS);

      if (roommatesJson) setRoommates(JSON.parse(roommatesJson));
      else setRoommates(INITIAL_ROOMMATES);

      if (historyJson) setHistory(JSON.parse(historyJson));
      else setHistory(INITIAL_HISTORY);

      if (settingsJson) setSettings(JSON.parse(settingsJson));
      else setSettings(INITIAL_SETTINGS);

    } catch (e) {
      console.error('Failed to load storage data:', e);
      setTasks(INITIAL_TASKS);
      setRoommates(INITIAL_ROOMMATES);
      setHistory(INITIAL_HISTORY);
      setSettings(INITIAL_SETTINGS);
    } finally {
      setIsLoaded(true);
    }
  };

  // Helper to trigger haptics
  const triggerHaptic = (type: 'success' | 'medium' | 'light' = 'medium') => {
    if (!settings.hapticEnabled) return;
    try {
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // safe fallback for web
    }
  };

  // Task Actions
  const addTask = async (newTaskData: Omit<Task, 'id' | 'isCompleted'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      isCompleted: false,
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    triggerHaptic('success');
  };

  const toggleTaskComplete = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const willBeCompleted = !targetTask.isCompleted;
    const nowIso = new Date().toISOString();

    const assignedRoommate = roommates.find(r => r.id === targetTask.assignedRoommateId);
    const roommateName = assignedRoommate ? assignedRoommate.name : 'Penghuni Kos';

    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          isCompleted: willBeCompleted,
          completedAt: willBeCompleted ? nowIso : undefined,
          completedBy: willBeCompleted ? roommateName : undefined,
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));

    // Update Roommate score and add to history if completed
    if (willBeCompleted && assignedRoommate) {
      const points = targetTask.priority === 'Tinggi' ? 20 : targetTask.priority === 'Sedang' ? 15 : 10;
      
      const updatedRoommates = roommates.map(r => {
        if (r.id === assignedRoommate.id) {
          return {
            ...r,
            score: r.score + points,
            tasksCompletedCount: r.tasksCompletedCount + 1,
          };
        }
        return r;
      });
      setRoommates(updatedRoommates);
      await AsyncStorage.setItem(STORAGE_KEYS.ROOMMATES, JSON.stringify(updatedRoommates));

      const newHistItem: HistoryItem = {
        id: `hist-${Date.now()}`,
        taskId: targetTask.id,
        taskTitle: targetTask.title,
        category: targetTask.category,
        completedByRoommateName: roommateName,
        completedAt: nowIso,
        pointsEarned: points,
      };
      const updatedHistory = [newHistItem, ...history];
      setHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));

      triggerHaptic('success');
      triggerNotification('🎉 Tugas Selesai!', `${roommateName} menyelesaikan "${targetTask.title}" (+${points} Poin)`);
    } else {
      triggerHaptic('medium');
    }
  };

  const deleteTask = async (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    triggerHaptic('light');
  };

  const editTask = async (updatedTask: Task) => {
    const updated = tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    triggerHaptic('medium');
  };

  // Roommate Actions
  const addRoommate = async (roommateData: Omit<Roommate, 'id' | 'score' | 'tasksCompletedCount'>) => {
    const newRoommate: Roommate = {
      ...roommateData,
      id: `roommate-${Date.now()}`,
      score: 0,
      tasksCompletedCount: 0,
    };
    const updated = [...roommates, newRoommate];
    setRoommates(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.ROOMMATES, JSON.stringify(updated));
    triggerHaptic('success');
  };

  const deleteRoommate = async (id: string) => {
    const updated = roommates.filter(r => r.id !== id);
    setRoommates(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.ROOMMATES, JSON.stringify(updated));
    triggerHaptic('light');
  };

  // Schedule Action: Auto-rotate duties among roommates fairly
  const rotateWeeklySchedule = async () => {
    if (roommates.length === 0 || tasks.length === 0) return;

    const roommateIds = roommates.map(r => r.id);
    const updatedTasks = tasks.map((task, index) => {
      // Shift assignment index deterministically
      const nextRoommateId = roommateIds[(index + 1) % roommateIds.length];
      return {
        ...task,
        assignedRoommateId: nextRoommateId,
        isCompleted: false, // Reset weekly completion status on rotate
      };
    });

    setTasks(updatedTasks);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
    triggerHaptic('success');

    triggerNotification(
      '🔄 Jadwal Berhasil Diacak!',
      'Pembagian tugas kebersihan minggu ini telah diperbarui secara adil.'
    );
  };

  // Notification Simulation
  const triggerNotification = (title: string, message: string) => {
    setActiveNotification({ title, message, visible: true });
  };

  const dismissNotification = () => {
    setActiveNotification(prev => prev ? { ...prev, visible: false } : null);
  };

  // Settings
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  };

  const resetToDefaultData = async () => {
    setTasks(INITIAL_TASKS);
    setRoommates(INITIAL_ROOMMATES);
    setHistory(INITIAL_HISTORY);
    setSettings(INITIAL_SETTINGS);
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TASKS,
      STORAGE_KEYS.ROOMMATES,
      STORAGE_KEYS.HISTORY,
      STORAGE_KEYS.SETTINGS,
    ]);
    triggerHaptic('success');
    triggerNotification('✨ Data Direset', 'Semua data telah dikembalikan ke kondisi demo awal.');
  };

  // Calculate Cleanliness Score (% of completed tasks out of total)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const cleanlinessScore = totalTasks === 0 ? 100 : Math.round((completedTasks / totalTasks) * 100);

  if (!isLoaded) return null;

  return (
    <AppContext.Provider
      value={{
        tasks,
        roommates,
        history,
        settings,
        activeNotification,
        addTask,
        toggleTaskComplete,
        deleteTask,
        editTask,
        addRoommate,
        deleteRoommate,
        rotateWeeklySchedule,
        triggerNotification,
        dismissNotification,
        updateSettings,
        resetToDefaultData,
        cleanlinessScore,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
