jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => require('expo-router').useRouter(),
}));
import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { withSpring } from 'react-native-reanimated';
import { BottomNavigation } from './bottom-navigation';

let mockReduced = false;
let mockPlatform = 'android';
let mockRejectJSRead = false;
let mockOnUI = false;
const mockNavigate = jest.fn();
let mockPan: any;
let mockReaction: {
  prepare(): number;
  react(next: number, previous: number): void;
};
let mockPreviousSegment = -1;
const mockFail = jest.fn();
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  GestureStateManager: { fail: (...args: unknown[]) => mockFail(...args) },
  usePanGesture: (config: unknown) => {
    mockPan = config;
    return config;
  },
}));
jest.mock('react-native-worklets', () => ({
  scheduleOnUI: (callback: () => void) => {
    mockOnUI = true;
    try {
      callback();
    } finally {
      mockOnUI = false;
    }
  },
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) =>
    callback(...args),
}));
jest.mock('react-native', () => ({
  View: 'view',
  Text: 'text',
  Platform: {
    get OS() {
      return mockPlatform;
    },
  },
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('./motion', () => ({ MotionPressable: 'pressable' }));
jest.mock('./navigation-surface', () => ({ NavigationSurface: 'surface' }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));
jest.mock('lucide-react-native', () => ({
  Home: 'icon',
  NotebookPen: 'icon',
  Compass: 'icon',
  Route: 'icon',
  CircleUserRound: 'icon',
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));
jest.mock('@/providers/journey', () => ({
  useJourney: () => ({ setBarHeight: jest.fn() }),
}));
jest.mock('@/providers/motion', () => ({
  useMotionPreference: () => mockReduced,
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'pill' },
  useSharedValue: (initial: number) =>
    require('react').useRef({
      current: initial,
      get() {
        if (mockRejectJSRead && !mockOnUI) {
          throw new Error('Synchronous UI value read on JS');
        }
        return this.current;
      },
      set(value: number) {
        this.current = value;
      },
    }).current,
  useAnimatedStyle: (callback: () => unknown) => callback(),
  useAnimatedReaction: (
    prepare: () => number,
    react: (next: number, previous: number) => void
  ) => {
    mockReaction = { prepare, react };
  },
  withSpring: jest.fn((value) => value),
  cancelAnimation: jest.fn(),
}));

let root: Root;
const tabs = () => root.container.queryAll((node) => node.type === 'pressable');
const measure = async (width: number) =>
  act(async () => {
    tabs().forEach((tab, index) =>
      tab.props.onLayout({
        nativeEvent: { layout: { x: index * width, y: 13, width, height: 60 } },
      })
    );
  });
beforeEach(() => {
  jest.clearAllMocks();
  mockReduced = false;
  mockPlatform = 'android';
  mockRejectJSRead = false;
  mockPreviousSegment = -1;
  root = createRoot();
});

const updatePreview = async () =>
  act(async () => {
    const next = mockReaction.prepare();
    mockReaction.react(next, mockPreviousSegment);
    mockPreviousSegment = next;
  });
const iconColors = () =>
  root.container
    .queryAll((node) => node.type === 'icon')
    .map((node) => node.props.color);
const labelColors = () =>
  root.container
    .queryAll((node) => node.type === 'text')
    .map((node) => Object.assign({}, ...node.props.style).color);

it('starts the pill and dispatches a native tap without waiting for JS touch-end', async () => {
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  await measure(100);
  await act(async () => {
    mockPan.onTouchesDown({ numberOfTouches: 1, allTouches: [{ x: 450, y: 20 }] });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockPan.onTouchesUp).toEqual(expect.any(Function));
    mockPan.onTouchesUp();
  });
  expect(withSpring).toHaveBeenLastCalledWith(426, expect.anything());
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/profile');
  expect(tabs()[0].props.accessibilityState.selected).toBe(true);
  await act(async () => mockPan.onTouchesUp());
  expect(mockNavigate).toHaveBeenCalledTimes(1);
});

it('does not dispatch a native tap after system cancellation', async () => {
  await act(async () => root.render(createElement(BottomNavigation, { active: 'home' })));
  await measure(100);
  await act(async () => {
    mockPan.onTouchesDown({ numberOfTouches: 1, allTouches: [{ x: 450, y: 20 }] });
    mockPan.onTouchesCancel();
    mockPan.onTouchesUp();
  });
  expect(mockNavigate).not.toHaveBeenCalled();
});

it('commits a tap once without synchronously reading UI state on release', async () => {
  jest.useFakeTimers();
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  await measure(100);
  await act(async () => {
    tabs()[2].props.onTouchStart();
    mockPan.onTouchesDown({ numberOfTouches: 1, allTouches: [{ x: 250, y: 20 }] });
    tabs()[2].props.onPressIn();
  });
  await act(async () => mockPan.onTouchesUp());
  await act(async () => {
    mockRejectJSRead = true;
    try {
      tabs()[2].props.onTouchEnd();
      tabs()[2].props.onPress();
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/_tabs/explore');
    } finally {
      mockRejectJSRead = false;
    }
  });
  await act(async () => jest.runOnlyPendingTimers());
});

it('previews five tab segments without changing the selected page', async () => {
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  await measure(100);
  const initial = iconColors();
  mockPan.onActivate({ translationX: 5 });
  for (const [translationX, segment] of [
    [49.9, 0],
    [50, 1],
    [149.9, 1],
    [150, 2],
    [249.9, 2],
    [250, 3],
    [350, 4],
    [50, 1],
  ]) {
    mockPan.onUpdate({ translationX });
    await updatePreview();
    const expected = initial.map((_color, index) =>
      index === segment ? initial[0] : initial[1]
    );
    expect(iconColors()).toEqual(expected);
    expect(labelColors()).toEqual(expected);
    expect(tabs()[0].props.accessibilityState.selected).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  }
  mockPan.onDeactivate({ canceled: false, y: 20, velocityX: 0 });
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/tutoring');
  await updatePreview();
  expect(iconColors()[1]).toBe(initial[0]);
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'tutoring' }))
  );
  await updatePreview();
  expect(iconColors()[1]).toBe(initial[0]);
  expect(tabs()[1].props.accessibilityState.selected).toBe(true);
});

it('clears the preview on cancellation, including with reduced motion', async () => {
  mockReduced = true;
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  await measure(100);
  const initial = iconColors();
  mockPan.onActivate({ translationX: 5 });
  mockPan.onUpdate({ translationX: 200 });
  await updatePreview();
  expect(iconColors()[2]).toBe(initial[0]);
  mockPan.onDeactivate({ canceled: true, y: 20, velocityX: 0 });
  await updatePreview();
  expect(iconColors()).toEqual(initial);
  expect(labelColors()).toEqual(initial);
  expect(mockNavigate).not.toHaveBeenCalled();
});
afterEach(async () => {
  await act(async () => root.unmount());
  jest.useRealTimers();
});

it('highlights a held tab but moves the pill only when the destination commits', async () => {
  jest.useFakeTimers();
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'path' }))
  );
  await measure(100);
  const selectedColor = iconColors()[3];
  await act(async () => tabs()[0].props.onPressIn());
  expect(withSpring).not.toHaveBeenCalled();
  expect(iconColors()[0]).toBe(selectedColor);
  expect(tabs()[3].props.accessibilityState.selected).toBe(true);
  expect(tabs()[0].props.accessibilityState.selected).toBe(false);
  await act(async () => jest.advanceTimersByTime(1500));
  expect(mockNavigate).not.toHaveBeenCalled();
  await act(async () => {
    tabs()[0].props.onPressOut();
    tabs()[0].props.onPress();
  });
  await act(async () => jest.runOnlyPendingTimers());
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/home');
  expect(iconColors()[0]).toBe(selectedColor);
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  expect(tabs()[0].props.accessibilityState.selected).toBe(true);
  expect(withSpring).toHaveBeenLastCalledWith(26, expect.anything());
});

it('restores Traseu when a press preview is cancelled without navigating', async () => {
  jest.useFakeTimers();
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'path' }))
  );
  await measure(100);
  const initial = iconColors();
  await act(async () => tabs()[0].props.onPressIn());
  await act(async () => tabs()[0].props.onPressOut());
  await act(async () => jest.runOnlyPendingTimers());
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(iconColors()).toEqual(initial);
  expect(withSpring).not.toHaveBeenCalled();
});

it('retains the future tab after leaving its press area upward and commits on touch release', async () => {
  jest.useFakeTimers();
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'path' }))
  );
  await measure(100);
  const selectedColor = iconColors()[3];
  await act(async () => {
    tabs()[0].props.onTouchStart?.();
    mockPan.onTouchesDown({ numberOfTouches: 1, allTouches: [{ x: 50, y: 20 }] });
    tabs()[0].props.onPressIn();
  });
  // Pressability emits press-out when moving outside its retention rectangle,
  // even though the finger is still down.
  await act(async () => tabs()[0].props.onPressOut());
  await act(async () => jest.runOnlyPendingTimers());
  expect(iconColors()[0]).toBe(selectedColor);
  expect(mockNavigate).not.toHaveBeenCalled();
  // Native responder release may arrive before the bubbling touch-end event.
  await act(async () => tabs()[0].props.onPress());
  expect(mockNavigate).not.toHaveBeenCalled();
  await act(async () => {
    mockPan.onTouchesUp();
    tabs()[0].props.onTouchEnd();
  });
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/home');
  await act(async () => tabs()[0].props.onPress());
  expect(mockNavigate).toHaveBeenCalledTimes(1);
});

it('restores the route preview on a system touch cancellation', async () => {
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'path' }))
  );
  await measure(100);
  const initial = iconColors();
  await act(async () => {
    tabs()[0].props.onTouchStart();
    tabs()[0].props.onPressIn();
  });
  await act(async () => tabs()[0].props.onTouchCancel());
  expect(iconColors()).toEqual(initial);
  expect(mockNavigate).not.toHaveBeenCalled();
});

it('lets a pill drag own its release without also activating the original tab', async () => {
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  await measure(100);
  await act(async () => {
    tabs()[0].props.onTouchStart();
    tabs()[0].props.onPressIn();
  });
  mockPan.onActivate({ translationX: 5 });
  mockPan.onUpdate({ translationX: 200 });
  await act(async () => {
    tabs()[0].props.onPressOut();
    mockPan.onTouchesUp();
    mockPan.onDeactivate({ canceled: false, velocityX: 0 });
    tabs()[0].props.onTouchEnd();
    tabs()[0].props.onPress();
  });
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/explore');
});

it('previews a held tab without spring travel with reduced motion', async () => {
  mockReduced = true;
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'path' }))
  );
  await measure(100);
  const selectedColor = iconColors()[3];
  await act(async () => tabs()[0].props.onPressIn());
  expect(iconColors()[0]).toBe(selectedColor);
  expect(withSpring).not.toHaveBeenCalled();
  expect(mockNavigate).not.toHaveBeenCalled();
  await act(async () => tabs()[0].props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/home');
});

it('keeps press previews exclusive to Android', async () => {
  mockPlatform = 'web';
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'path' }))
  );
  expect(tabs()[0].props.onPressIn).toBeUndefined();
  expect(tabs()[0].props.onPressOut).toBeUndefined();
  await act(async () => tabs()[0].props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/home');
});

it('moves one noninteractive pill using measured positions and retargets after resizing', async () => {
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  await measure(100);
  await act(async () => tabs()[3].props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/path');
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'path' }))
  );
  expect(withSpring).toHaveBeenLastCalledWith(
    326,
    expect.objectContaining({ dampingRatio: 1 })
  );
  await measure(120);
  expect(withSpring).toHaveBeenLastCalledWith(396, expect.anything());
  const pills = root.container.queryAll((node) => node.type === 'pill');
  expect(pills).toHaveLength(1);
  expect(pills[0].props.pointerEvents).toBe('none');
  expect(pills[0].props.accessible).toBe(false);
  expect(tabs()[3].props.accessibilityState.selected).toBe(true);
});

it('keeps the selected pill but removes spring travel with reduced motion', async () => {
  mockReduced = true;
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  await measure(100);
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'profile' }))
  );
  expect(withSpring).not.toHaveBeenCalled();
  expect(root.container.queryAll((node) => node.type === 'pill')).toHaveLength(
    1
  );
  expect(tabs()[4].props.accessibilityState.selected).toBe(true);
});

it('tracks a drag without navigating and commits the nearest tab only on release', async () => {
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  await measure(100);
  mockPan.onTouchesDown({
    handlerTag: 1,
    numberOfTouches: 1,
    allTouches: [{ x: 50, y: 20 }],
  });
  expect(mockFail).not.toHaveBeenCalled();
  mockPan.onActivate({ translationX: 5 });
  mockPan.onUpdate({ translationX: 183 });
  expect(mockNavigate).not.toHaveBeenCalled();
  mockPan.onDeactivate({ canceled: false, y: 20, velocityX: 120 });
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/explore');
  expect(withSpring).toHaveBeenLastCalledWith(
    226,
    expect.objectContaining({ velocity: 120 })
  );
  mockPan.onFinalize();
  expect(mockNavigate).toHaveBeenCalledTimes(1);
});

it('rejects touches outside the navbar and restores the active tab on cancellation', async () => {
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  await measure(100);
  mockPan.onTouchesDown({
    handlerTag: 2,
    numberOfTouches: 1,
    allTouches: [{ x: 550, y: 20 }],
  });
  expect(mockFail).toHaveBeenCalledWith(2);
  mockPan.onActivate({ translationX: 5 });
  mockPan.onUpdate({ translationX: 200 });
  mockPan.onDeactivate({ canceled: true, y: 20, velocityX: 0 });
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(withSpring).toHaveBeenLastCalledWith(26, expect.anything());
});

it('allows a future tab press to move upward first and then scrub in both horizontal directions', async () => {
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'path' }))
  );
  await measure(100);
  const selectedColor = iconColors()[3];
  mockPan.onTouchesDown({
    handlerTag: 3,
    numberOfTouches: 1,
    allTouches: [{ x: 50, y: 20 }],
  });
  expect(mockFail).not.toHaveBeenCalled();
  expect(mockPan.failOffsetY).toBeUndefined();
  expect(mockPan.shouldCancelWhenOutside).toBe(false);
  mockPan.onActivate({ translationX: 5, translationY: -200 });
  for (const [translationX, segment] of [
    [200, 2],
    [400, 4],
    [100, 1],
  ]) {
    mockPan.onUpdate({ translationX, translationY: -200 });
    await updatePreview();
    expect(iconColors()[segment]).toBe(selectedColor);
    expect(tabs()[3].props.accessibilityState.selected).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  }
  mockPan.onDeactivate({ canceled: false, y: -200, velocityX: 0 });
  expect(mockNavigate).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/tutoring');
});

it('clamps beyond the bar and commits without a settling spring under reduced motion', async () => {
  mockReduced = true;
  await act(async () =>
    root.render(createElement(BottomNavigation, { active: 'home' }))
  );
  await measure(100);
  mockPan.onActivate({ translationX: 5 });
  mockPan.onUpdate({ translationX: 1000 });
  mockPan.onDeactivate({ canceled: false, y: 20, velocityX: 1000 });
  expect(mockNavigate).toHaveBeenCalledWith('/_tabs/profile');
  expect(withSpring).not.toHaveBeenCalled();
});

it.each([-13, 73])(
  'opens the previewed tab when release drifts vertically to y=%s',
  async (y) => {
    await act(async () =>
      root.render(createElement(BottomNavigation, { active: 'home' }))
    );
    await measure(100);
    const selectedColor = iconColors()[0];
    mockPan.onActivate({ translationX: 5 });
    mockPan.onUpdate({ translationX: 165 });
    await updatePreview();
    expect(iconColors()[2]).toBe(selectedColor);
    expect(mockNavigate).not.toHaveBeenCalled();
    mockPan.onDeactivate({ canceled: false, y, velocityX: 0 });
    expect(mockNavigate).toHaveBeenCalledWith('/_tabs/explore');
  }
);
