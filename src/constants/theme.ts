/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

export const Colors = {
  light: {
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
  },
  dark: {
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
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
