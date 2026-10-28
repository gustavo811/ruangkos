import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform, Vibration } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { useApp } from './AppContext';

export type MotionStatus = 
  | 'Diam / Stabil'
  | 'Gerakan Ringan'
  | 'Gerakan Kuat'
  | 'Goyangan Terdeteksi!'
  | 'Miring Kiri'
  | 'Miring Kanan'
  | 'Menghadap Atas'
  | 'Menghadap Bawah';

export type SensitivityLevel = 'Tinggi' | 'Sedang' | 'Rendah';

export type ShakeAction = 'none' | 'rotate_schedule' | 'reminder';

export interface MotionLog {
  id: string;
  time: string;
  type: MotionStatus;
  magnitude: number;
  x: number;
  y: number;
  z: number;
}

interface SensorContextType {
  // Accelerometer Real-Time Values
  data: { x: number; y: number; z: number };
  magnitude: number;
  delta: number;

  // Status & Motion Detection
  motionStatus: MotionStatus;
  isShaking: boolean;
  shakeCount: number;
  lastShakeTime: string | null;

  // Vibration Notification State
  vibrationActive: boolean;
  vibrateOnShake: boolean;
  setVibrateOnShake: (val: boolean) => void;
  inAppNotificationOnShake: boolean;
  setInAppNotificationOnShake: (val: boolean) => void;

  // Sensor Settings & Controls
  isSensorAvailable: boolean;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  toggleSensor: () => void;
  updateInterval: number;
  setUpdateIntervalMs: (ms: number) => void;
  sensitivity: SensitivityLevel;
  setSensitivity: (level: SensitivityLevel) => void;
  shakeAction: ShakeAction;
  setShakeAction: (action: ShakeAction) => void;

  // Motion History
  motionLogs: MotionLog[];
  clearLogs: () => void;
  resetShakeCount: () => void;

  // Simulation & Manual Triggering
  simulateMotion: (type: 'shake' | 'tilt_left' | 'tilt_right' | 'face_up' | 'idle') => void;
  triggerManualShake: () => void;
}

const SensorContext = createContext<SensorContextType | undefined>(undefined);

export const SensorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { triggerNotification, rotateWeeklySchedule } = useApp();

  // Accelerometer Data
  const [data, setData] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 1 });
  const [magnitude, setMagnitude] = useState<number>(1.0);
  const [delta, setDelta] = useState<number>(0);

  // Status & Motion Detection
  const [motionStatus, setMotionStatus] = useState<MotionStatus>('Diam / Stabil');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [shakeCount, setShakeCount] = useState<number>(0);
  const [lastShakeTime, setLastShakeTime] = useState<string | null>(null);

  // Vibration State
  const [vibrationActive, setVibrationActive] = useState<boolean>(false);
  const [vibrateOnShake, setVibrateOnShake] = useState<boolean>(true);
  const [inAppNotificationOnShake, setInAppNotificationOnShake] = useState<boolean>(true);

  // Configuration
  const [isSensorAvailable, setIsSensorAvailable] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [updateInterval, setUpdateIntervalState] = useState<number>(100); // 100ms
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('Sedang');
  const [shakeAction, setShakeAction] = useState<ShakeAction>('reminder');

  // Logs
  const [motionLogs, setMotionLogs] = useState<MotionLog[]>([]);

  // Refs for logic without re-render lag
  const prevDataRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 1 });
  const lastShakeTimestampRef = useRef<number>(0);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vibrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check hardware sensor availability on mount
  useEffect(() => {
    let isMounted = true;
    const checkAvailability = async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (isMounted) {
          setIsSensorAvailable(available);
          if (!available) {
            console.log('Hardware Accelerometer not available or on Web. Simulation mode ready.');
          }
        }
      } catch (err) {
        console.warn('Error checking accelerometer availability:', err);
        if (isMounted) setIsSensorAvailable(false);
      }
    };

    checkAvailability();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update sensor interval
  const setUpdateIntervalMs = (ms: number) => {
    setUpdateIntervalState(ms);
    Accelerometer.setUpdateInterval(ms);
  };

  // Helper to trigger vibration and haptic feedback
  const triggerVibrationAlert = () => {
    if (!vibrateOnShake) return;

    setVibrationActive(true);
    if (vibrationTimeoutRef.current) clearTimeout(vibrationTimeoutRef.current);

    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        // Pattern: vibrate 250ms, wait 100ms, vibrate 250ms
        Vibration.vibrate([0, 250, 100, 250]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        // Web Vibration API fallback if supported
        if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    } catch (e) {
      console.warn('Vibration failed:', e);
    }

    vibrationTimeoutRef.current = setTimeout(() => {
      setVibrationActive(false);
    }, 1200);
  };

  // Sensitivity Thresholds
  const getThresholds = () => {
    switch (sensitivity) {
      case 'Tinggi':
        return { deltaShake: 0.65, magDeviation: 0.55 };
      case 'Rendah':
        return { deltaShake: 1.35, magDeviation: 1.15 };
      case 'Sedang':
      default:
        return { deltaShake: 0.95, magDeviation: 0.80 };
    }
  };

  // Log a motion event
  const addMotionLog = (type: MotionStatus, mag: number, coords: { x: number; y: number; z: number }) => {
    const newLog: MotionLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      time: new Date().toLocaleTimeString('id-ID', { hour12: false }),
      type,
      magnitude: Number(mag.toFixed(2)),
      x: Number(coords.x.toFixed(2)),
      y: Number(coords.y.toFixed(2)),
      z: Number(coords.z.toFixed(2)),
    };

    setMotionLogs((prev) => [newLog, ...prev.slice(0, 14)]);
  };

  // Handle incoming raw accelerometer data
  const processReading = (reading: { x: number; y: number; z: number }) => {
    const { x, y, z } = reading;
    const prev = prevDataRef.current;

    const dx = Math.abs(x - prev.x);
    const dy = Math.abs(y - prev.y);
    const dz = Math.abs(z - prev.z);
    const currentDelta = dx + dy + dz;
    const currentMag = Math.sqrt(x * x + y * y + z * z);

    setData(reading);
    setDelta(currentDelta);
    setMagnitude(currentMag);
    prevDataRef.current = reading;

    const now = Date.now();
    const thresholds = getThresholds();
    const isMagSpike = Math.abs(currentMag - 1.0) > thresholds.magDeviation;
    const isDeltaSpike = currentDelta > thresholds.deltaShake;

    // Shake detected!
    if (isMagSpike || isDeltaSpike) {
      // Cooldown 800ms
      if (now - lastShakeTimestampRef.current > 800) {
        lastShakeTimestampRef.current = now;
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
        
        setIsShaking(true);
        setMotionStatus('Goyangan Terdeteksi!');
        setShakeCount((prev) => prev + 1);
        setLastShakeTime(timeStr);

        // 1. Vibration
        triggerVibrationAlert();

        // 2. Shake Action execution
        if (shakeAction === 'rotate_schedule') {
          rotateWeeklySchedule();
        }

        // 3. In-App Notification
        if (inAppNotificationOnShake) {
          const actionMsg = shakeAction === 'rotate_schedule' 
            ? ' • Jadwal piket otomatis diacak!' 
            : '';
          triggerNotification(
            '💥 Goyangan Terdeteksi!',
            `Sensor API merespons dengan notifikasi getaran (G: ${currentMag.toFixed(2)}g)${actionMsg}`
          );
        }

        addMotionLog('Goyangan Terdeteksi!', currentMag, reading);

        // Keep shake status active for 1.5 seconds for UI visibility
        if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = setTimeout(() => {
          setIsShaking(false);
        }, 1500);
      }
      return;
    }

    // If currently in shaking feedback window, keep status visible
    if (isShaking) return;

    // Normal motion status classification
    if (currentDelta > 0.35) {
      setMotionStatus('Gerakan Kuat');
    } else if (currentDelta > 0.18) {
      setMotionStatus('Gerakan Ringan');
    } else if (x > 0.45) {
      setMotionStatus('Miring Kanan');
    } else if (x < -0.45) {
      setMotionStatus('Miring Kiri');
    } else if (y > 0.45) {
      setMotionStatus('Menghadap Bawah');
    } else if (y < -0.45) {
      setMotionStatus('Menghadap Atas');
    } else {
      setMotionStatus('Diam / Stabil');
    }
  };

  // Accelerometer subscription effect
  useEffect(() => {
    if (!isActive) return;

    let subscription: { remove: () => void } | null = null;

    Accelerometer.setUpdateInterval(updateInterval);

    try {
      subscription = Accelerometer.addListener((reading) => {
        processReading(reading);
      });
    } catch (err) {
      console.warn('Failed to start accelerometer listener:', err);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      if (vibrationTimeoutRef.current) clearTimeout(vibrationTimeoutRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [isActive, updateInterval, sensitivity, shakeAction, vibrateOnShake, inAppNotificationOnShake]);

  // Toggle sensor listening
  const toggleSensor = () => {
    setIsActive((prev) => !prev);
  };

  // Reset shake count
  const resetShakeCount = () => {
    setShakeCount(0);
    setLastShakeTime(null);
  };

  // Clear logs
  const clearLogs = () => {
    setMotionLogs([]);
  };

  // Manual trigger for shake demo
  const triggerManualShake = () => {
    simulateMotion('shake');
  };

  // Interactive motion simulator (works on web, emulators, or real devices)
  const simulateMotion = (type: 'shake' | 'tilt_left' | 'tilt_right' | 'face_up' | 'idle') => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    if (type === 'shake') {
      // Simulate rapid fluctuating acceleration sequence
      const frames = [
        { x: 1.45, y: -0.85, z: 1.80 },
        { x: -1.72, y: 1.20, z: -0.40 },
        { x: 1.95, y: -1.50, z: 2.10 },
        { x: -1.30, y: 0.90, z: 0.80 },
        { x: 0.10, y: 0.05, z: 0.98 },
      ];

      let frameIdx = 0;
      processReading(frames[0]);

      simulationIntervalRef.current = setInterval(() => {
        frameIdx++;
        if (frameIdx < frames.length) {
          processReading(frames[frameIdx]);
        } else {
          if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
          }
        }
      }, 120);

    } else if (type === 'tilt_left') {
      processReading({ x: -0.75, y: 0.12, z: 0.65 });
    } else if (type === 'tilt_right') {
      processReading({ x: 0.75, y: 0.12, z: 0.65 });
    } else if (type === 'face_up') {
      processReading({ x: 0.02, y: 0.04, z: 0.99 });
    } else if (type === 'idle') {
      processReading({ x: 0.00, y: 0.01, z: 1.00 });
    }
  };

  return (
    <SensorContext.Provider
      value={{
        data,
        magnitude,
        delta,
        motionStatus,
        isShaking,
        shakeCount,
        lastShakeTime,
        vibrationActive,
        vibrateOnShake,
        setVibrateOnShake,
        inAppNotificationOnShake,
        setInAppNotificationOnShake,
        isSensorAvailable,
        isActive,
        setIsActive,
        toggleSensor,
        updateInterval,
        setUpdateIntervalMs,
        sensitivity,
        setSensitivity,
        shakeAction,
        setShakeAction,
        motionLogs,
        clearLogs,
        resetShakeCount,
        simulateMotion,
        triggerManualShake,
      }}
    >
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensor must be used within a SensorProvider');
  }
  return context;
};
