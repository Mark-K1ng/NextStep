// src/theme/tokens.ts
// Design tokens for NextStep app

// Dark theme (default)
export const darkColors = {
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
};

// Light theme (optional)
export const lightColors = {
  background: '#FAF7FF',
  surface: '#FFFFFF',
  border: '#E7E0F5',
  textPrimary: '#1B1726',
  textSecondary: '#6B6480',
  primary: '#7C3AED',
};

// Spacing scale (4, 8, 12, 16, 24, 32, 48)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

// Radius scale (8, 12, 16)
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

// Typography
// Plus Jakarta Sans ExtraBold Italic for wordmark and hero headings only
// Inter for everything else
export const typography = {
  display: {
    fontFamily: 'Plus Jakarta Sans', // ExtraBold Italic 800
    fontSize: 36,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: 'Plus Jakarta Sans', // ExtraBold Italic 800
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  heading: {
    fontFamily: 'Inter', // SemiBold 600
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    fontFamily: 'Inter', // Regular 400
    fontSize: 16,
    fontWeight: '400',
  },
  caption: {
    fontFamily: 'Inter', // Regular 400
    fontSize: 12,
    fontWeight: '400',
  },
  label: {
    fontFamily: 'Inter', // Medium 500
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
};

// Export the current theme (dark by default)
export const colors = darkColors;