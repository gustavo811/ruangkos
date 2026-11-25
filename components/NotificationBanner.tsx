import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../context/NotificationContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

export const NotificationBanner: React.FC = () => {
  const router = useRouter();
  const { activeNotification, dismissNotification } = useApp();
  const { openNotificationById } = useNotifications();
  const [slideAnim] = useState(() => new Animated.Value(-100));

  const hideBanner = React.useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      dismissNotification();
    });
  }, [slideAnim, dismissNotification]);

  useEffect(() => {
    if (activeNotification && activeNotification.visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 6,
        tension: 40,
      }).start();

      const timer = setTimeout(() => {
        hideBanner();
      }, 4500);

      return () => clearTimeout(timer);
    } else {
      hideBanner();
    }
  }, [activeNotification, hideBanner, slideAnim]);

  if (!activeNotification || !activeNotification.visible) return null;

  const handlePressBanner = () => {
    const notifId = activeNotification.id;
    const targetRoute = activeNotification.targetRoute;
    hideBanner();

    if (notifId) {
      openNotificationById(notifId);
    } else if (targetRoute) {
      router.push(targetRoute as any);
    } else {
      router.push('/notifications' as any);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Pressable
        onPress={handlePressBanner}
        style={({ pressed }) => [
          styles.contentContainer,
          pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="notifications" size={22} color="#FFFFFF" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{activeNotification.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {activeNotification.message}
          </Text>
          <Text style={styles.tapHint}>Ketuk notifikasi untuk membuka halaman tujuan →</Text>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            hideBanner();
          }}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 9999,
    ...SHADOWS.large,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  tapHint: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  closeButton: {
    padding: 6,
    marginLeft: SPACING.xs,
  },
});
