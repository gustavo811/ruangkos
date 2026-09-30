export const COLORS = {
  // Primary Millennial Palette
  primary: '#6C5CE7', // Modern Violet
  primaryLight: '#A29BFE',
  primaryDark: '#4C3AE3',
  primaryGradient: ['#6C5CE7', '#8E7CFF'],
  
  secondary: '#00B894', // Fresh Mint
  secondaryLight: '#55E6C1',
  secondaryDark: '#00896F',

  accent: '#FF7675', // Soft Coral / Amber
  accentYellow: '#FDCB6E', // Warm Yellow
  accentBlue: '#0984E3', // Electric Blue

  // Dark & Light Surface Colors
  background: '#F6F8FC',
  surface: '#FFFFFF',
  surfaceBorder: '#E2E8F0',
  surfaceMuted: '#F1F5F9',

  // Dark Mode Overrides
  darkBackground: '#0F172A',
  darkSurface: '#1E293B',
  darkSurfaceBorder: '#334155',

  // Typography Colors
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textLight: '#FFFFFF',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Categories Colors
  catKamarMandi: '#00CEC9',
  catDapur: '#FF7675',
  catRuangTamu: '#6C5CE7',
  catSampah: '#FDCB6E',
  catHalaman: '#10B981',
  catLainnya: '#B2BEC3',
};

export const SHADOWS = {
  small: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#4C3AE3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  large: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};
