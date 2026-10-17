export const colors = {
  dark: {
    background: '#18171F',
    surface: '#25232F',
    surfaceElevated: '#2E2B3A',
    border: '#3A3748',
    textPrimary: '#F5F3FA',
    textSecondary: '#A5A1B5',
    primary: '#7C3AED',
    primaryPressed: '#6D28D9',
    accent: '#A78BFA',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  light: {
    background: '#FAF7FF',
    surface: '#FFFFFF',
    border: '#E7E0F5',
    textPrimary: '#1B1726',
    textSecondary: '#6B6480',
    primary: '#7C3AED',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const typography = {
  fontFamily: {
    heading: 'PlusJakartaSans_800ExtraBold_Italic',
    body: 'Inter',
  },
  fontSize: {
    display: 32,
    title: 24,
    heading: 20,
    body: 16,
    caption: 14,
    label: 12,
  },
  fontWeight: {
    bold: '700',
    semibold: '600',
    medium: '500',
    regular: '400',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;
