// src/theme/tokens.ts
// Design system tokens for NextStep app

export const darkTheme = {
  // Colors
  background: "#18171F",
  surface: "#25232F",
  surfaceElevated: "#2E2B3A",
  border: "#3A3748",
  textPrimary: "#F5F3FA",
  textSecondary: "#A5A1B5",
  primary: "#7C3AED",
  primaryPressed: "#6D28D9",
  accent: "#A78BFA",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
};

export const lightTheme = {
  // Colors
  background: "#FAF7FF",
  surface: "#FFFFFF",
  surfaceElevated: "#F5F3FA",
  border: "#E7E0F5",
  textPrimary: "#1B1726",
  textSecondary: "#6B6480",
  primary: "#7C3AED",
  primaryPressed: "#6D28D9",
  accent: "#A78BFA",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
};

export const darkColors = darkTheme;
export const lightColors = lightTheme;
export const colors = darkColors;
export const theme = darkColors;

const spacingArray = [0, 4, 8, 12, 16, 24, 32, 48] as const;
export const spacing = Object.assign(
  [...spacingArray] as [0, 4, 8, 12, 16, 24, 32, 48],
  {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    "2xl": 32,
    "3xl": 48,
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
// Plus Jakarta Sans ExtraBold Italic for wordmark and hero headings only
// Inter for everything else
export const typography = {
  display: {
    fontFamily: "PlusJakartaSans_ExtraBoldItalic",
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: "PlusJakartaSans_ExtraBoldItalic",
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: "Inter",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "600" as const,
  },
  body: {
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  caption: {
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400" as const,
  },
  label: {
    fontFamily: "Inter",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
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
export type Spacing = typeof spacing;
export type Radius = typeof radius;
