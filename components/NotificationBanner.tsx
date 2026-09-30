import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../constants/theme';

export const NotificationBanner: React.FC = () => {
  const { activeNotification, dismissNotification } = useApp();
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

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
  }, [activeNotification]);

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      dismissNotification();
    });
  };

  if (!activeNotification || !activeNotification.visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications" size={22} color="#FFFFFF" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{activeNotification.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {activeNotification.message}
          </Text>
        </View>

        <Pressable onPress={hideBanner} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>
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
  closeButton: {
    padding: 6,
    marginLeft: SPACING.xs,
  },
});
