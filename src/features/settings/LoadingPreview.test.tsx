import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import LoadingPreview from './LoadingPreview';
import { previewElements } from './loading-preview-catalogue';
jest.mock('react-native', () => ({ Platform: { OS: 'android' }, View: 'view', FlatList: (props: { ListHeaderComponent: unknown }) => require('react').createElement('list', props, props.ListHeaderComponent), StyleSheet: { create: (s: unknown) => s } }));
jest.mock('@/components/design', () => ({ Screen: 'screen', Copy: 'copy', BackHeader: (props: { trailing: unknown }) => require('react').createElement('back', props, props.trailing) }));
jest.mock('@/components/motion', () => ({ MotionPressable: 'button' }));
jest.mock('lucide-react-native', () => ({ Binary: 'texture-icon', Pause: 'pause-icon', Play: 'play-icon' }));
jest.mock('@/components/Input', () => ({ Input: 'input' }));
jest.mock('./loading-preview-elements', () => ({ PreviewElementContent: 'specimen' }));
jest.mock('./loading-preview-shapes', () => ({ PreviewElementSkin: 'skin' }));
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({ textSecondary: '#777', accentText: '#fff', background: '#000' }) }));
jest.mock('@/hooks/use-bottom-safe-area', () => ({ useBottomSafeArea: () => ({ inset: 34 }) }));
jest.mock('@/providers/motion', () => ({ useMotionPreference: () => false }));
jest.mock('@nextstep/ascii-reveal-native', () => ({ AsciiProvider: 'provider', AsciiActivity: 'activity', AsciiReveal: 'reveal' }));
let root: Root;
beforeEach(() => { root = createRoot(); });
afterEach(async () => { await act(async () => root.unmount()); });
const list = () => root.container.queryAll(n => n.type === 'list')[0];
const gallery = async () => act(async () => root.render(createElement(LoadingPreview)));
const renderRows = () => act(async () => root.render(createElement('rows', {}, ...list().props.data.map((item: unknown) => list().props.renderItem({ item })))));
it('lists one uniquely keyed specimen per pattern and keeps one scrolling owner', async () => {
  await gallery();
  expect(root.container.queryAll(n => n.type === 'screen')[0].props.scrollable).toBe(false);
  const entries = list().props.data;
  expect(entries).toEqual(previewElements);
  expect(new Set(entries.map((item: string[]) => item[0])).size).toBe(entries.length);
  expect(entries.every((item: string[]) => item[3])).toBe(true);
  expect(list().props.removeClippedSubviews).toBe(false);
  await renderRows();
  expect(root.container.queryAll(n => n.type === 'specimen')).toHaveLength(entries.length);
  expect(root.container.queryAll(n => n.type === 'panel')).toHaveLength(0);
  expect(root.container.queryAll(n => n.type === 'skin')).toHaveLength(entries.length);
  expect(root.container.queryAll(n => n.type === 'activity' && n.props.active)).toHaveLength(1);
  expect(root.container.queryAll(n => n.type === 'view' && n.props.pointerEvents === 'none').every(n => n.props.importantForAccessibility === 'no-hide-descendants')).toBe(true);
});
it('keeps the visible skin enabled during scrolling without replacing the mounted element', async () => {
  await gallery();
  const target = previewElements.find(item => item[0] === 'catalogue')!;
  await act(async () => {
    list().props.onViewableItemsChanged({ viewableItems: [{ item: target, isViewable: true }] });
    list().props.onScrollBeginDrag?.();
    list().props.onMomentumScrollBegin?.();
  });
  await renderRows();
  const skins = root.container.queryAll(n => n.type === 'skin');
  expect(skins).toHaveLength(previewElements.length);
  expect(root.container.queryAll(n => n.type === 'specimen')).toHaveLength(previewElements.length);
  const active = root.container.queryAll(n => n.type === 'activity' && n.props.active);
  expect(active).toHaveLength(1);
});
it('filters Romanian labels without requiring diacritics', async () => {
  await gallery();
  const search = root.container.queryAll(n => n.type === 'input')[0];
  await act(async () => search.props.onChangeText('parola'));
  expect(list().props.data.map((entry: string[]) => entry[0])).toEqual(['password']);
});
it('switches to actual components without a simulated waiting timer', async () => {
  await gallery();
  await act(async () => root.container.queryAll(n => n.type === 'button')[0].props.onPress());
  expect(list().props.extraData.loading).toBe(false);
});

it('keeps both circular icon controls in fixed navigation chrome and toggles motion', async () => {
  await gallery();
  const buttons = root.container.queryAll(n => n.type === 'button');
  expect(buttons).toHaveLength(2);
  for (const button of buttons) {
    expect(button.props.style({ pressed: false })[0]).toMatchObject({ width: 48, height: 48, borderRadius: 24 });
  }
  expect(root.container.queryAll(n => n.type === 'back')[0].props.trailing).toBeTruthy();
  expect(root.container.queryAll(n => n.type === 'screen')[0].props.nativeActions).toBeTruthy();
  expect(buttons[1].props.accessibilityLabel).toBe('Oprește animațiile');
  await act(async () => buttons[1].props.onPress());
  expect(root.container.queryAll(n => n.type === 'provider')[0].props.reducedMotion).toBe(true);
  expect(root.container.queryAll(n => n.type === 'button')[1].props.accessibilityLabel).toBe('Pornește animațiile');
});
