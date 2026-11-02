import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { NavigationSurface } from './navigation-surface.ios';

let mockAvailable = true;
let mockReduceTransparency = false;
let mockTransparencyChanged: (enabled: boolean) => void;
const mockRemove = jest.fn();
jest.mock('react-native', () => ({
  View: 'view',
  StyleSheet: { create: (styles: unknown) => styles },
  AccessibilityInfo: {
    isReduceTransparencyEnabled: async () => mockReduceTransparency,
    addEventListener: (_name: string, callback: (enabled: boolean) => void) => {
      mockTransparencyChanged = callback;
      return { remove: mockRemove };
    },
  },
}));
jest.mock('expo-glass-effect', () => ({
  GlassView: 'glass',
  isLiquidGlassAvailable: () => mockAvailable,
  isGlassEffectAPIAvailable: () => mockAvailable,
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));

beforeEach(() => {
  mockAvailable = true;
  mockReduceTransparency = false;
  jest.clearAllMocks();
});

it.each(['supported', 'unavailable', 'reduced transparency'])(
  'uses the appropriate navigation material when %s',
  async (scenario) => {
    mockAvailable = scenario !== 'unavailable';
    mockReduceTransparency = scenario === 'reduced transparency';
    const root = createRoot();
    try {
      await act(async () => root.render(createElement(NavigationSurface)));
      const glass = root.container.queryAll((node) => node.type === 'glass');
      expect(glass).toHaveLength(scenario === 'supported' ? 1 : 0);
      if (scenario === 'supported') {
        expect(glass[0].props.colorScheme).toBe('dark');
        await act(async () => mockTransparencyChanged(true));
        expect(
          root.container.queryAll((node) => node.type === 'glass')
        ).toHaveLength(0);
      }
    } finally {
      await act(async () => root.unmount());
    }
    expect(mockRemove).toHaveBeenCalled();
  }
);
