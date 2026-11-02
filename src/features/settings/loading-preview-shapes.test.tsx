jest.mock('react-native-reanimated', () => ({
  __esModule: true, default: { View: 'animated-view' },
  useSharedValue: (initial: number) => { const ref = require('react').useRef(null); if (!ref.current) { let current = initial; ref.current = { get: () => current, set: (next: number) => { current = next; } }; } return ref.current; },
  useDerivedValue: (get: () => number) => require('react').useRef({ get }).current,
  useAnimatedStyle: (style: () => unknown) => style(),
  cancelAnimation: jest.fn(), withTiming: (value: number) => value,
  Easing: { linear: 'linear' }, ReduceMotion: { Never: 'never' },
}));
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => callback(...args) }));
import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { AsciiSkin, AsciiSkinOverlay } from '@/components/ascii-skin';
import { previewSkinOptions } from './loading-preview-shapes';
jest.mock('react-native', () => ({ View: 'view', StyleSheet: { absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, create: (styles: unknown) => styles } }));
jest.mock('@nextstep/ascii-reveal-native', () => ({ AsciiSkeleton: 'texture', useAsciiContext: () => ({ reduced: false, theme: { background: '#000' } }) }));
let root: Root;
beforeEach(() => { root = createRoot(); });
afterEach(async () => { await act(async () => root.unmount()); });
it('uses exact fractional control dimensions and follows a resize without changing its child', async () => {
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, radius: 12 }, createElement('actual-button'))));
  const overlay = () => root.container.queryAll(n => n.type === 'view' && n.props.onLayout)[0];
  await act(async () => overlay().props.onLayout({ nativeEvent: { layout: { width: 173.5, height: 47.75 } } }));
  expect(root.container.queryAll(n => n.type === 'texture')[0].props).toMatchObject({ width: 173.5, height: 47.75 });
  expect(overlay().props.style[2].borderRadius).toBe(12);
  await act(async () => overlay().props.onLayout({ nativeEvent: { layout: { width: 245.25, height: 71.5 } } }));
  expect(root.container.queryAll(n => n.type === 'texture')[0].props).toMatchObject({ width: 245.25, height: 71.5 });
  expect(root.container.queryAll(n => n.type === 'actual-button')).toHaveLength(1);
  await act(async () => root.render(createElement(AsciiSkin, { enabled: false, radius: 12 }, createElement('actual-button'))));
  expect(root.container.queryAll(n => n.type === 'texture')).toHaveLength(0);
  expect(root.container.queryAll(n => n.type === 'actual-button')).toHaveLength(1);
});
it('skins internal field surfaces only inside an enabled preview scope', async () => {
  const child = createElement(AsciiSkinOverlay, { radius: 16 });
  await act(async () => root.render(child));
  expect(root.container.queryAll(n => n.type === 'view')).toHaveLength(0);
  await act(async () => root.render(createElement(AsciiSkin, { enabled: true, internal: true }, child)));
  expect(root.container.queryAll(n => n.type === 'view' && n.props.onLayout)).toHaveLength(1);
  expect(previewSkinOptions('input').internal).toBe(true);
  expect(previewSkinOptions('select').internal).toBe(true);
  expect(previewSkinOptions('button-primary').internal).toBe(true);
  expect(previewSkinOptions('choice').radius).toBe(24);
});
