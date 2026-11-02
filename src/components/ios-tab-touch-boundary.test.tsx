import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { IosTabTouchBoundary } from './ios-tab-touch-boundary';
import { registerIosTabReveal, startIosTabReveal } from './ios-tab-context';
import { cancelAnimation } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

let mockTouch: (event: unknown, manager: { fail(): void }) => void;
jest.mock('react-native', () => ({ View: 'view', StyleSheet: { create: (value: unknown) => value } }));
jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Manual: () => ({ onTouchesDown(callback: typeof mockTouch) { mockTouch = callback; return this; } }) },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: unknown) => require('react').useRef({ current: initial, get() { return this.current; }, set(value: unknown) { this.current = value; } }).current,
  cancelAnimation: jest.fn(),
}));
jest.mock('react-native-worklets', () => ({ scheduleOnRN: jest.fn((fn: () => void) => fn()) }));

it('interrupts only the visible reveal and allows every destination to animate', async () => {
  jest.useFakeTimers();
  const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
  const root = createRoot();
  const a = { current: 0.25, get() { return this.current; }, set(value: number) { this.current = value; } };
  const b = { ...a };
  const startB = jest.fn();
  const removeA = registerIosTabReveal('a', jest.fn(), jest.fn(), jest.fn(), a as any);
  const removeB = registerIosTabReveal('b', startB, jest.fn(), jest.fn(), b as any);
  try {
    await act(async () => root.render(createElement(IosTabTouchBoundary, {}, createElement('control'))));
    startIosTabReveal('a');
    now.mockReturnValue(1100);
    const manager = { fail: jest.fn() };
    mockTouch({}, manager);
    expect(a.get()).toBe(1);
    expect(b.get()).toBe(0.25);
    expect(cancelAnimation).toHaveBeenCalledWith(a);
    expect(cancelAnimation).not.toHaveBeenCalledWith(b);
    expect(manager.fail).toHaveBeenCalledTimes(1);
    mockTouch({}, manager);
    expect(scheduleOnRN).not.toHaveBeenCalled();
    startIosTabReveal('b');
    expect(startB).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(440);
    now.mockReturnValue(2000);
    a.set(0.25);
    mockTouch({}, manager);
    expect(a.get()).toBe(0.25);
    expect(manager.fail).toHaveBeenCalledTimes(3);
  } finally {
    await act(async () => root.unmount());
    removeA(); removeB(); now.mockRestore(); jest.useRealTimers();
  }
});
