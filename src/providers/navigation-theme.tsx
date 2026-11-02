import { useMemo, type PropsWithChildren } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

export function NavigationThemeProvider({ children }: PropsWithChildren) {
  const palette = useTheme();
  const value = useMemo(() => {
    const base = palette.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: palette.accentText,
        background: palette.background,
        card: palette.surface,
        text: palette.textPrimary,
        border: palette.border,
        notification: palette.dangerText,
      },
    };
  }, [palette]);
  return <ThemeProvider value={value}>{children}</ThemeProvider>;
}
