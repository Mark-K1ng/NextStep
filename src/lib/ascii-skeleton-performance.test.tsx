jest.mock('../../packages/ascii-reveal-native/src/font.native', () => ({ useAsciiFont: () => require('@shopify/react-native-skia').useFont() }));
import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { AsciiSkeleton } from '../../packages/ascii-reveal-native/src/skeleton.native';
import { useDerivedValue } from 'react-native-reanimated';
let mockActive = false;
const mockPhase = { get: () => 900 };
jest.mock('../../packages/ascii-reveal-native/src/provider', () => ({
  useAsciiContext: () => true,
  useAsciiScope: () => ({ theme: { foreground: '#777', accent: '#fff' }, reduced: false, active: mockActive, phase: mockPhase }),
}));
jest.mock('react-native', () => ({ View: 'view', Text: 'text', Platform: { OS: 'android' }, StyleSheet: { create: (s: unknown) => s, absoluteFill: {} } }));
jest.mock('react-native-reanimated', () => ({ useDerivedValue: jest.fn((get: () => unknown) => ({ get })) }));
jest.mock('@shopify/react-native-skia', () => {
  const font = { getGlyphIDs: () => [1], getGlyphWidths: () => [6], getMetrics: () => ({ ascent: -8, descent: 2 }) };
  return { Canvas: 'canvas', Group: 'group', Mask: 'mask', Rect: 'rect', LinearGradient: 'gradient', Text: 'glyph', useFont: () => font, matchFont: () => font, vec: (x: number,y: number) => ({x,y}) };
});
let root: Root;
beforeEach(() => { mockActive = false; jest.clearAllMocks(); root = createRoot(); });
afterEach(async () => act(async () => root.unmount()));
it('unmounts off-screen wave worklets and paints visible highlights without offscreen mask layers', async () => {
  const render = () => act(async () => root.render(createElement(AsciiSkeleton, { rows: 22, height: 220 })));
  await render();
  expect(useDerivedValue).not.toHaveBeenCalled();
  expect(root.container.queryAll(n => n.type === 'mask')).toHaveLength(0);
  expect(root.container.queryAll(n => n.type === 'glyph')).toHaveLength(22);
  mockActive = true;
  await render();
  expect(useDerivedValue).toHaveBeenCalled();
  expect(root.container.queryAll(n => n.type === 'mask')).toHaveLength(0);
  expect(root.container.queryAll(n => n.type === 'gradient')).toHaveLength(1);
  jest.mocked(useDerivedValue).mockClear();
  mockActive = false;
  await render();
  expect(useDerivedValue).not.toHaveBeenCalled();
  expect(root.container.queryAll(n => n.type === 'mask')).toHaveLength(0);
});
