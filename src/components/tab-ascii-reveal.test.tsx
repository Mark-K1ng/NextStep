import { IosAppearingTabContext } from './ios-tab-context';
import { act, createElement, useState } from 'react';
import { createRoot } from 'test-renderer';
const { TabAsciiReveal } = jest.requireActual('./tab-ascii-reveal.tsx');
import { TabAsciiReveal as IosReveal } from './tab-ascii-reveal.ios';
import { TabAsciiReveal as AndroidReveal } from './tab-ascii-reveal.android';

let mockFocused = false;
let mockSegments = ['_tabs', '(home)', 'index'];
jest.mock('expo-router', () => ({ useSegments: () => mockSegments, useIsFocused: () => mockFocused }));
jest.mock('react-native', () => ({ Platform: { OS: 'android' }, StyleSheet: { create: (styles: unknown) => styles } }));
jest.mock('./ascii-skin', () => ({ AsciiSkin: 'skin' }));

it('starts a 220 ms reveal after destination frames without remounting its content', async () => {
  const root = createRoot();
  function Content() {
    const [offset, setOffset] = useState(0);
    return createElement('content', { offset, setOffset });
  }
  const tree = () => createElement(TabAsciiReveal, { tab: '(path)' }, createElement(Content));
  try {
    await act(async () => root.render(tree()));
    const skin = () => root.container.queryAll(n => n.type === 'skin')[0];
    const content = () => root.container.queryAll(n => n.type === 'content')[0];
    expect(skin().props.enabled).toBe(false);
    await act(async () => content().props.setOffset(420));
    for (const tab of ['(path)', '(profile)', '(path)']) {
      mockSegments = ['_tabs', tab, 'index'];
      await act(async () => root.render(tree()));
      expect(skin().props).toMatchObject({ enabled: tab === '(path)', duration: 220, startOnFrame: true, internal: true, style: { flex: 1 } });
      expect(skin().props.delay).toBeUndefined();
      expect(content().props.offset).toBe(420);
    }
    mockSegments = ['_tabs', '(path)', 'settings'];
    await act(async () => root.render(tree()));
    expect(skin().props.enabled).toBe(true);
  } finally {
    await act(async () => root.unmount());
  }
});


it('prepares iOS cached tabs and starts their reveal without queued frames', async () => {
  const native = jest.requireMock('react-native'); native.Platform.OS = 'ios';
  const root = createRoot();
  try {
    mockSegments = ['_tabs', '(home)', 'index'];
    await act(async () => root.render(createElement(IosReveal, { tab: '(path)' }, createElement('page'))));
    expect(root.container.queryAll(n => n.type === 'skin')[0].props).toMatchObject({ enabled: false, prepareOnBlur: true, startOnFrame: false, duration: 220 });
    mockFocused = true;
    await act(async () => root.render(createElement(IosReveal, { tab: '(path)' }, createElement('page'))));
    // Global segments still point at Home; native focus must already start Path.
    expect(root.container.queryAll(n => n.type === 'skin')[0].props.enabled).toBe(true);
  } finally { await act(async () => root.unmount()); native.Platform.OS = 'android'; mockFocused = false; }
});


it('starts on UIKit appearance even before navigation focus and segments update', async () => {
  const native = jest.requireMock('react-native'); native.Platform.OS = 'ios';
  mockFocused = false; mockSegments = ['_tabs', '(home)', 'index'];
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(IosAppearingTabContext.Provider, { value: '(path)' }, createElement(IosReveal, { tab: '(path)' }, createElement('page')))));
    expect(root.container.queryAll(n => n.type === 'skin')[0].props).toMatchObject({ enabled: true, duration: 220, startOnFrame: false });
  } finally { await act(async () => root.unmount()); native.Platform.OS = 'android'; }
});


it('starts Android at navigation focus without global segment, UIKit or frame waits', async () => {
  mockSegments = ['_tabs', 'home', 'index'];
  mockFocused = false;
  const root = createRoot();
  function Content() { const [value, setValue] = useState('draft'); return createElement('content', { value, setValue }); }
  const tree = () => createElement(AndroidReveal, { tab: 'path' }, createElement(Content));
  try {
    await act(async () => root.render(tree()));
    const skin = () => root.container.queryAll(n => n.type === 'skin')[0];
    const content = () => root.container.queryAll(n => n.type === 'content')[0];
    expect(skin().props.enabled).toBe(false);
    await act(async () => content().props.setValue('retained'));
    for (const focus of [true, false, true]) {
      mockFocused = focus;
      await act(async () => root.render(tree()));
      expect(skin().props.enabled).toBe(focus);
      expect(skin().props.duration).toBe(220);
      expect(skin().props.startOnFrame).toBeUndefined();
      expect(skin().props.nativeTab).toBeUndefined();
      expect(skin().props.prepareOnBlur).toBe(true);
      expect(content().props.value).toBe('retained');
    }
  } finally { await act(async () => root.unmount()); mockFocused = false; }
});
