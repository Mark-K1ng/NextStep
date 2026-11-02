import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import IosTabStack from './ios-tab-stack';

jest.mock('react-native', () => ({ Platform: { OS: 'android' },
  View: 'view',
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('./ascii-skin', () => ({
  AsciiSkin: ({ children }: { children: unknown }) => children,
}));
let mockSegments = ['_tabs', '(path)', 'index'];
let mockReduced = false;
const mockTiming = jest.fn((value: number, _config: unknown) => value);
jest.mock('expo-router', () => ({
  useIsFocused: () => true,
  useSegments: () => mockSegments,
  useFocusEffect: (callback: () => void) =>
    require('react').useEffect(callback, [callback]),
  Stack: Object.assign(
    () => {
      const React = require('react');
      return React.createElement(require('./ios-tab-home').default);
    },
    { Screen: 'stack-screen' }
  ),
}));
jest.mock('@/providers/motion', () => ({
  useMotionPreference: () => mockReduced,
}));
jest.mock('@/theme/motion', () => ({ motion: { easeOut: 'ease-out' } }));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'animated-view' },
  cancelAnimation: jest.fn(),
  withTiming: (value: number, config: unknown) => mockTiming(value, config),
  useAnimatedStyle: (callback: () => unknown) => callback(),
  useSharedValue: (initial: number) =>
    require('react').useRef({
      value: initial,
      get() {
        return this.value;
      },
      set(value: number) {
        this.value = value;
      },
    }).current,
}));
jest.mock('@/hooks/use-stack-motion', () => ({ useStackMotion: () => ({}) }));
jest.mock('@/features/path/Path', () => ({
  __esModule: true,
  default: () => {
    const React = require('react');
    const [offset, setOffset] = React.useState(0);
    return React.createElement('path-screen', { offset, setOffset });
  },
}));
jest.mock('@/features/profile/Profile', () => ({
  __esModule: true,
  default: 'profile-screen',
}));
jest.mock('@/features/explore/Explore', () => ({
  __esModule: true,
  default: 'explore-screen',
}));
jest.mock('@/features/home/home', () => ({
  __esModule: true,
  default: 'home-screen',
}));
jest.mock('@/features/tutoring/tutoring-home', () => ({
  __esModule: true,
  default: 'tutoring-screen',
}));

it.each([false, true])(
  'keeps tab content/state local while segments change (reduced motion=%s)',
  async (reduced) => {
    mockReduced = reduced;
    mockTiming.mockClear();
    const root = createRoot();
    const tree = () =>
      createElement(
        'tabs',
        {},
        ...['(home)', '(tutoring)', '(explore)', '(path)', '(profile)'].map(
          (segment) => createElement(IosTabStack, { key: segment, segment })
        )
      );
    try {
      await act(async () => root.render(tree()));
      expect(mockTiming).not.toHaveBeenCalled();
      const path = () =>
        root.container.queryAll((node) => node.type === 'path-screen');
      expect(path()).toHaveLength(1);
      await act(async () => path()[0].props.setOffset(420));
      for (const target of [
        '(profile)',
        '(explore)',
        '(home)',
        '(tutoring)',
        '(path)',
      ]) {
        mockSegments = ['_tabs', target, 'index'];
        await act(async () => root.render(tree()));
        expect(path()).toHaveLength(1);
        expect(path()[0].props.offset).toBe(420);
        for (const name of ['home', 'tutoring', 'explore', 'profile'])
          expect(
            root.container.queryAll((node) => node.type === `${name}-screen`)
          ).toHaveLength(1);
      }
    } finally {
      await act(async () => root.unmount());
    }
  }
);
