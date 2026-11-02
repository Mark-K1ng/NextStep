import { useThemePreference } from '@/providers/theme';
import { usePalettePreference } from '@/providers/palette';
import { useColorScheme } from 'react-native';

export function useTheme() {
  const scheme = useColorScheme();
  const { mode } = useThemePreference();
  const { darkPalette, lightPalette } = usePalettePreference();
  const theme = mode === 'system' ? (scheme ?? 'dark') : mode;
  return theme === 'dark' ? darkPalette : lightPalette;
}
