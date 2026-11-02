jest.mock('../../packages/ascii-reveal-native/src/font.native', () => ({ useAsciiFont: () => require('@shopify/react-native-skia').useFont() }));
import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { AsciiReveal } from '../../packages/ascii-reveal-native/src/reveal.native';
import { makeImageFromView } from '@shopify/react-native-skia';

let mockReduced = false;
const mockPhase = { get: () => 900 };
const mockDrawText = jest.fn();
const mockScope = jest.fn(() => ({ theme: { foreground: '#777777', accent: '#ffffff', background: '#000000' }, reduced: mockReduced, active: true, phase: mockPhase }));
jest.mock('../../packages/ascii-reveal-native/src/provider', () => ({
  useAsciiContext: () => true, useAsciiScope: (...args: []) => mockScope(...args),
}));
jest.mock('react-native', () => ({ View: 'view', Platform: { OS: 'android' }, StyleSheet: { create: (s: unknown) => s, absoluteFill: {} } }));
jest.mock('react-native-worklets', () => ({ scheduleOnRN: (f: () => void) => f() }));
jest.mock('react-native-reanimated', () => ({
  Easing: { linear: 'linear' }, ReduceMotion: { Never: 'never' }, cancelAnimation: jest.fn(),
  useSharedValue: (value: number) => require('react').useRef({ value, get() { return this.value; }, set(next: number) { this.value = next; } }).current,
  useDerivedValue: (get: () => unknown) => ({ get }),
  withTiming: (value: number) => value,
}));
jest.mock('@shopify/react-native-skia', () => {
  const pixels = new Uint8Array(48 * 48 * 4);
  // Only this ten-pixel square is painted by the child; the rest is transparent.
  for (let y = 16; y < 26; y += 1) for (let x = 16; x < 26; x += 1) pixels.fill(255, (y * 48 + x) * 4, (y * 48 + x + 1) * 4);
  const image = { width: () => 48, height: () => 48, readPixels: () => pixels, dispose: jest.fn() };
  const font = { setSize: jest.fn(), getMetrics: () => ({ ascent: -3, descent: 1 }) };
  const canvas = { drawRect: jest.fn(), drawImageRect: jest.fn(), drawText: (...args: unknown[]) => mockDrawText(...args) };
  return {
    Canvas: 'canvas', Picture: 'picture', ColorType: { RGBA_8888: 4 }, AlphaType: { Unpremul: 1 },
    makeImageFromView: jest.fn(async () => image), matchFont: () => font, useFont: () => font,
    Skia: {
      Color: (color: string) => color === '#000000' ? [0, 0, 0, 1] : [1, 1, 1, 1],
      XYWHRect: (x: number, y: number, width: number, height: number) => ({ x, y, width, height }),
      Paint: () => ({ setAntiAlias: jest.fn(), setColor: jest.fn(), setAlphaf: jest.fn(), dispose: jest.fn() }),
      PictureRecorder: () => ({ beginRecording: () => canvas, finishRecordingAsPicture: () => ({}), dispose: jest.fn() }),
      Surface: { MakeOffscreen: () => ({ getCanvas: () => canvas, flush: jest.fn(), makeImageSnapshot: () => image, dispose: jest.fn() }) },
    },
  };
});
let root: Root;
let frames: (() => Promise<void>)[];
const realRaf = global.requestAnimationFrame, realCancel = global.cancelAnimationFrame;
beforeEach(() => {
  jest.clearAllMocks(); mockReduced = false; frames = []; root = createRoot();
  global.requestAnimationFrame = ((f: () => Promise<void>) => { frames.push(f); return frames.length; }) as typeof requestAnimationFrame;
  global.cancelAnimationFrame = jest.fn();
});
afterEach(async () => { await act(async () => root.unmount()); global.requestAnimationFrame = realRaf; global.cancelAnimationFrame = realCancel; });
async function render(props: React.ComponentProps<typeof AsciiReveal>) {
  await act(async () => root.render(createElement(AsciiReveal, props, createElement('actual-element'))));
  const container = root.container.queryAll(n => n.type === 'view' && !!n.props.onLayout)[0];
  await act(async () => container.props.onLayout({ nativeEvent: { layout: { width: 48, height: 48 } } }));
  await act(async () => { for (const f of frames.splice(0)) await f(); });
}
it('textures only the actual child silhouette, without a generic rectangular skeleton', async () => {
  await render({ loading: true });
  expect(makeImageFromView).toHaveBeenCalledTimes(1);
  root.container.queryAll(n => n.type === 'picture')[0].props.picture.get();
  expect(mockDrawText).toHaveBeenCalled();
  for (const [, x, y] of mockDrawText.mock.calls) {
    expect(x).toBeGreaterThan(10); expect(x).toBeLessThan(28);
    expect(y).toBeGreaterThan(10); expect(y).toBeLessThan(30);
  }
  expect(mockScope).toHaveBeenCalledWith(true);
  expect(root.container.queryAll(n => n.props.accessibilityRole === 'progressbar')).toHaveLength(1);
});
it('uses an explicit geometry slot without snapshotting or replacing it with a stock skeleton', async () => {
  await render({ loading: true, placeholder: createElement('matching-inputs') });
  expect(makeImageFromView).not.toHaveBeenCalled();
  expect(root.container.queryAll(n => n.type === 'matching-inputs')).toHaveLength(1);
  expect(root.container.queryAll(n => n.type === 'actual-element')).toHaveLength(1);
});
it('keeps the adaptive shape still in reduced motion and shows real content immediately when ready', async () => {
  mockReduced = true;
  await render({ loading: true });
  root.container.queryAll(n => n.type === 'picture')[0].props.picture.get();
  const count = mockDrawText.mock.calls.length;
  mockDrawText.mockClear();
  root.container.queryAll(n => n.type === 'picture')[0].props.picture.get();
  expect(mockDrawText).toHaveBeenCalledTimes(count);
  await render({ loading: false });
  expect(root.container.queryAll(n => n.type === 'canvas')).toHaveLength(0);
  expect(root.container.queryAll(n => n.props.importantForAccessibility === 'auto')).toHaveLength(1);
});
it('fails open to real ready content if native capture is unavailable', async () => {
  jest.mocked(makeImageFromView).mockRejectedValueOnce(new Error('unavailable'));
  await render({ loading: false });
  expect(root.container.queryAll(n => n.type === 'actual-element')).toHaveLength(1);
  expect(root.container.queryAll(n => n.type === 'canvas')).toHaveLength(0);
});

it('switches directly from the element mask to ready content without a second decoding stage', async () => {
  await render({ loading: true });
  expect(makeImageFromView).toHaveBeenCalledTimes(1);
  await render({ loading: false });
  expect(makeImageFromView).toHaveBeenCalledTimes(1);
  expect(root.container.queryAll(n => n.type === 'canvas')).toHaveLength(0);
  expect(root.container.queryAll(n => n.props.accessibilityRole === 'progressbar')).toHaveLength(0);
});
