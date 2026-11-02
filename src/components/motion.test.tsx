jest.mock('react-native-worklets', () => ({}));
import { act, createElement, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { AccessibilityInfo } from 'react-native';
import { cancelAnimation, withTiming } from 'react-native-reanimated';
import { MotionProvider } from '@/providers/motion';
import {
  AnimatedProgress,
  MotionPressable,
  StateFeedback,
  MotionContent,
  MotionChevron,
} from './motion';
import { Button } from './Button';
import { useStackMotion } from '@/hooks/use-stack-motion';
jest.mock('./ascii-loading', () => ({ AsciiLoading: 'ascii-loading' }));

let mockReduced = false;
let mockMotionListener: (reduced: boolean) => void;
const mockRemove = jest.fn();
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  View: 'view',
  Text: 'text',
  Pressable: 'pressable',
  ActivityIndicator: 'spinner',
  StyleSheet: { create: (styles: unknown) => styles },
  AccessibilityInfo: {
    addEventListener: jest.fn((_event, listener) => {
      mockMotionListener = listener;
      return { remove: mockRemove };
    }),
  },
}));
jest.mock('react-native-reanimated', () => {
  const reveal: Record<string, unknown> = {};
  for (const name of [
    'duration',
    'delay',
    'easing',
    'withInitialValues',
    'withTargetValues',
  ]) {
    reveal[name] = () => reveal;
  }
  return {
    __esModule: true,
    default: {
      View: 'animated-view',
      createAnimatedComponent: (value: unknown) => value,
    },
    FadeInDown: reveal,
    FadeOutDown: reveal,
    LinearTransition: reveal,
    useReducedMotion: () => mockReduced,
    cubicBezier: () => 'ease-out',
    Easing: { bezier: () => 'ease-out' },
    useSharedValue: (initial: number) =>
      require('react').useRef({
        get: () => initial,
        set: jest.fn(),
      }).current,
    useAnimatedStyle: (callback: () => unknown) => callback(),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withSequence: jest.fn((...values) => values),
    cancelAnimation: jest.fn(),
  };
});
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));

let root: Root;
const render = async (children: ReactNode) => {
  await act(async () =>
    root.render(createElement(MotionProvider, {}, children))
  );
};
const target = () =>
  root.container.queryAll((node) => node.type === 'pressable')[0];
const flattened = (style: any): any =>
  Object.assign({}, ...[style].flat(Infinity).filter(Boolean));

beforeEach(() => {
  jest.clearAllMocks();
  mockReduced = false;
  root = createRoot();
});
afterEach(async () => act(async () => root.unmount()));

it('responds on press-in, restores on release and preserves action callbacks', async () => {
  const onPress = jest.fn();
  const onPressIn = jest.fn();
  const onPressOut = jest.fn();
  await render(
    createElement(MotionPressable, { onPress, onPressIn, onPressOut }, 'Save')
  );
  await act(async () => target().props.onPressIn({}));
  expect(flattened(target().props.style).transform).toEqual([{ scale: 0.97 }]);
  expect(onPressIn).toHaveBeenCalledTimes(1);
  expect(onPress).not.toHaveBeenCalled();
  await act(async () => target().props.onPressOut({}));
  expect(flattened(target().props.style).transform).toEqual([{ scale: 1 }]);
  expect(onPressOut).toHaveBeenCalledTimes(1);
  await act(async () => target().props.onPress());
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('turns off movement immediately when the system changes to reduced motion', async () => {
  await render(createElement(MotionPressable, {}, 'Save'));
  await act(async () => target().props.onPressIn({}));
  await act(async () => mockMotionListener(true));
  expect(flattened(target().props.style)).toMatchObject({
    transitionDuration: 0,
    transform: [{ scale: 1 }],
  });
  expect(AccessibilityInfo.addEventListener).toHaveBeenCalledTimes(1);
  await act(async () => mockMotionListener(false));
  expect(flattened(target().props.style).transitionDuration).toBe(120);
});

it('updates native push/back transitions when the live reduced-motion setting changes', async () => {
  function StackOptions() {
    return createElement('stack-options', { options: useStackMotion() });
  }
  await render(createElement(StackOptions));
  const options = () =>
    root.container.queryAll((node) => node.type === 'stack-options')[0].props
      .options;
  expect(options()).toMatchObject({
    animation: 'default',
    gestureDirection: 'horizontal',
    gestureEnabled: true,
    contentStyle: { backgroundColor: '#18171F' },
  });
  await act(async () => mockMotionListener(true));
  expect(options().animation).toBe('fade');
  expect(options().contentStyle.backgroundColor).toBe('#18171F');
  await act(async () => mockMotionListener(false));
  expect(options().animation).toBe('default');
});

it('uses the initial reduced setting and cleans up the preference subscription', async () => {
  mockReduced = true;
  await render(createElement(MotionPressable, {}, 'Save'));
  expect(flattened(target().props.style).transitionDuration).toBe(0);
  await act(async () => root.unmount());
  expect(mockRemove).toHaveBeenCalledTimes(1);
  root = createRoot();
});

it('keeps row feedback flat and forwards hover state to style callbacks', async () => {
  const style = jest.fn(({ pressed, hovered }) => ({
    opacity: pressed || hovered ? 0.7 : 1,
  }));
  await render(
    createElement(MotionPressable, { feedback: 'highlight', style }, 'Row')
  );
  await act(async () => target().props.onHoverIn({}));
  expect(style).toHaveBeenLastCalledWith({ pressed: false, hovered: true });
  await act(async () => target().props.onPressIn({}));
  expect(flattened(target().props.style).transform).toBeUndefined();
});

it('retains button loading/disabled semantics while motion is installed', async () => {
  await render(createElement(Button, { loading: true }, 'Export'));
  expect(target().props.disabled).toBe(true);
  expect(target().props.accessibilityLabel).toBe('Export');
  expect(target().props.accessibilityState).toMatchObject({
    disabled: true,
    busy: true,
  });
  await act(async () => target().props.onPressIn({}));
  expect(flattened(target().props.style).transform).toEqual([{ scale: 1 }]);
});

it.each([
  [3, 4, 3, 4, '75%'],
  [9, 4, 4, 4, '100%'],
  [-1, 4, 0, 4, '0%'],
  [2, 0, 0, 1, '0%'],
  [NaN, Infinity, 0, 1, '0%'],
])(
  'keeps visual and spoken progress aligned for %s / %s',
  async (value, total, now, max, width) => {
    await render(
      createElement(AnimatedProgress, { value, total, label: 'Progress' })
    );
    const progress = root.container.queryAll(
      (node) => node.props.accessibilityRole === 'progressbar'
    )[0];
    expect(progress.props.accessibilityValue).toEqual({ min: 0, max, now });
    const fill = root.container.queryAll(
      (node) => node.type === 'animated-view'
    )[0];
    expect(flattened(fill.props.style).width).toBe(width);
    await act(async () => mockMotionListener(true));
    expect(
      flattened(
        root.container.queryAll((node) => node.type === 'animated-view')[0]
          .props.style
      ).transitionDuration
    ).toBe(0);
  }
);

it('acknowledges state changes without animating initial list items', async () => {
  await render(createElement(StateFeedback, { value: false }, 'Bookmark'));
  expect(withTiming).not.toHaveBeenCalled();
  await render(createElement(StateFeedback, { value: true }, 'Bookmark'));
  expect(withTiming).toHaveBeenCalledTimes(1);
  expect(cancelAnimation).toHaveBeenCalled();
  await act(async () => mockMotionListener(true));
  await render(createElement(StateFeedback, { value: false }, 'Bookmark'));
  expect(withTiming).toHaveBeenCalledTimes(1);
});

it('keeps inline form state when reduced motion changes and removes spatial animation', async () => {
  function Draft() {
    const [value, setValue] = useState('draft');
    return createElement('draft-input', { value, onChange: setValue });
  }
  await render(createElement(MotionContent, {}, createElement(Draft)));
  const content = () =>
    root.container.queryAll((node) => node.type === 'animated-view')[0];
  const input = () =>
    root.container.queryAll((node) => node.type === 'draft-input')[0];
  expect(content().props.entering).toBeDefined();
  expect(content().props.exiting).toBeDefined();
  await act(async () => input().props.onChange('unsaved change'));
  await act(async () => mockMotionListener(true));
  expect(input().props.value).toBe('unsaved change');
  expect(content().props.entering).toBeUndefined();
  expect(content().props.exiting).toBeUndefined();
  expect(content().props.layout).toBeUndefined();
});

it('rotates disclosure indicators immediately under reduced motion', async () => {
  await render(createElement(MotionChevron, { expanded: false }, 'Chevron'));
  const style = () =>
    flattened(
      root.container.queryAll((node) => node.type === 'animated-view')[0].props
        .style
    );
  expect(style().transform).toEqual([{ rotate: '0deg' }]);
  await act(async () => mockMotionListener(true));
  await render(createElement(MotionChevron, { expanded: true }, 'Chevron'));
  expect(style().transform).toEqual([{ rotate: '180deg' }]);
  expect(style().transitionDuration).toBe(0);
});

it('sizes button ASCII to its measured label and preserves button geometry while busy', async () => {
  await render(createElement(Button, { loading: true }, 'Salvează modificările'));
  const label = root.container.queryAll(node => node.type === 'view' && !!node.props.onLayout)[0];
  await act(async () => label.props.onLayout({ nativeEvent: { layout: { width: 182.3, height: 48 } } }));
  const indicator = root.container.queryAll(node => node.type === 'ascii-loading')[0];
  expect(indicator.props).toMatchObject({ width: 183, height: 48, decorative: true });
  expect(target().props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  expect(target().props.accessibilityLabel).toBe('Salvează modificările');
  expect(root.container.queryAll(node => node.type === 'text' && node.props.children === 'Salvează modificările')).toHaveLength(1);
});
