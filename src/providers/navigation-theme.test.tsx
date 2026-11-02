import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { darkColors, lightColors } from '@/theme/tokens';
import { createPalette } from '@/theme/palette';
import { NavigationThemeProvider } from './navigation-theme';

let mockPalette = darkColors;
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => mockPalette }));
jest.mock('expo-router', () => ({
  DarkTheme: { dark: true, colors: {} },
  DefaultTheme: { dark: false, colors: {} },
  ThemeProvider: 'navigation-theme',
}));

it.each([
  darkColors,
  lightColors,
  createPalette('#10B981', true),
  createPalette('#10B981', false),
])(
  'propagates the app appearance and palette to native navigation',
  async (palette) => {
    mockPalette = palette;
    const root = createRoot();
    try {
      await act(async () =>
        root.render(createElement(NavigationThemeProvider))
      );
      const provider = root.container.queryAll(
        (node) => node.type === 'navigation-theme'
      )[0];
      expect(provider.props.value).toMatchObject({
        dark: palette.isDark,
        colors: {
          primary: palette.accentText,
          background: palette.background,
          card: palette.surface,
          text: palette.textPrimary,
          border: palette.border,
        },
      });
    } finally {
      await act(async () => root.unmount());
    }
  }
);
