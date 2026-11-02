// src/theme/tokens.ts
// Design system tokens for NextStep app

export const darkTheme = {
  isDark: true,
  // Colors
  background: '#18171F',
  surface: '#25232F',
  surfaceElevated: '#2E2B3A',
  border: '#3A3748',
  textPrimary: '#F5F3FA',
  textSecondary: '#A5A1B5',
  primary: '#7C3AED',
  primaryPressed: '#6D28D9',
  accent: '#A78BFA',
  accentText: '#A78BFA',
  success: '#22C55E',
  successText: '#4ADE80',
  warning: '#F59E0B',
  warningText: '#FBBF24',
  danger: '#EF4444',
  dangerText: '#FF7373',
  dangerSurface: '#3B252D',
  onAccent: '#18171F',
};

export const lightTheme = {
  isDark: false,
  // Colors
  background: '#FAF7FF',
  surface: '#FFFFFF',
  surfaceElevated: '#F5F3FA',
  border: '#E7E0F5',
  textPrimary: '#1B1726',
  textSecondary: '#6B6480',
  primary: '#7C3AED',
  primaryPressed: '#6D28D9',
  accent: '#A78BFA',
  accentText: '#6D28D9',
  success: '#22C55E',
  successText: '#15803D',
  warning: '#F59E0B',
  warningText: '#92400E',
  danger: '#EF4444',
  dangerText: '#B91C1C',
  dangerSurface: '#FDECEC',
  onAccent: '#18171F',
};

export const darkColors = darkTheme;
export const lightColors = lightTheme;
export const colors = darkColors;
export const theme = darkColors;
export const squircle = { borderCurve: 'continuous' } as const;

const spacingArray = [0, 4, 8, 12, 16, 24, 32, 48] as const;
export const spacing = Object.assign(
  [...spacingArray] as [0, 4, 8, 12, 16, 24, 32, 48],
  {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
  }
);

const radiusArray = [0, 8, 12, 16] as const;
export const radius = Object.assign([...radiusArray] as [0, 8, 12, 16], {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
});

// Typography
// Plus Jakarta Sans throughout; italic extra-bold is reserved for brand/hero text.
export const typography = {
  display: {
    fontFamily: 'PlusJakartaSans',
    fontWeight: '800' as const,
    fontStyle: 'italic' as const,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: 'PlusJakartaSans',
    fontWeight: '700' as const,
    fontStyle: 'normal' as const,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  caption: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
};

// Export a combined tokens object for easy use
export const tokens = {
  dark: darkTheme,
  light: lightTheme,
  spacing,
  radius,
  typography,
};

export type Theme = typeof darkTheme;
export const interaction = { target: 48, pressedOpacity: 0.7 } as const;
export type Spacing = typeof spacing;
export type Radius = typeof radius;
