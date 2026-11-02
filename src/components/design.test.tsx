jest.mock('react-native-reanimated', () => ({}));
jest.mock('react-native-worklets', () => ({}));
jest.mock('expo-image', () => ({ Image: 'image' }));
import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { Screen, Panel, BackHeader, Copy } from './design';
import { NavigationFrame } from './navigation-frame.android';
jest.mock('./ascii-loading', () => ({ AsciiLoading: 'ascii-loading' }));
jest.mock('./navigation-surface', () => ({ NavigationSurface: 'surface' }));

let mockPlatform = 'ios';
let mockSegments = ['_tabs', 'explore'];
let mockWidth = 800;
jest.mock('react-native', () => ({
  Text: 'text',
  View: 'view',
  ScrollView: 'scroll',
  KeyboardAvoidingView: 'keyboard',
  Platform: {
    get OS() {
      return mockPlatform;
    },
  },
  useWindowDimensions: () => ({ height: 900, width: mockWidth }),
  StyleSheet: { create: (styles: unknown) => styles },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 34 }),
}));
jest.mock('react-native-screens/experimental', () => ({
  SafeAreaView: 'navigation-bounds',
}));
jest.mock('@/components/safe-area', () => ({ SafeAreaView: 'safe-area' }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/providers/journey', () => ({
  useJourney: () => ({ activeTab: 'home', barHeight: 88 }),
}));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ back: jest.fn() }),
}));
jest.mock('./bottom-navigation', () => ({
  BottomNavigation: 'bottom-navigation',
}));
jest.mock('./motion', () => ({ MotionPressable: 'pressable' }));
jest.mock('expo-router', () => ({
  Stack: { Screen: 'stack-screen' },
  useSegments: () => mockSegments,
}));
jest.mock('lucide-react-native', () => ({
  ArrowUpRight: 'icon',
  ArrowLeft: 'icon',
  ChevronRight: 'icon',
}));

let root: Root;
beforeEach(() => {
  mockPlatform = 'ios';
  mockWidth = 800;
  root = createRoot();
});
afterEach(async () => act(async () => root.unmount()));
const merged = (styles: any[]) => Object.assign({}, ...styles.filter(Boolean));

it('fills Android text lines without truncating or overriding an explicit break strategy', async () => {
  mockPlatform = 'android';
  await act(async () =>
    root.render(createElement(Copy, {}, 'Long school name'))
  );
  const text = () => root.container.queryAll((node) => node.type === 'text')[0];
  expect(text().props.textBreakStrategy).toBe('simple');
  expect(text().props.numberOfLines).toBeUndefined();
  expect(text().props.allowFontScaling).toBeUndefined();
  await act(async () =>
    root.render(
      createElement(Copy, { textBreakStrategy: 'balanced' }, 'Override')
    )
  );
  expect(text().props.textBreakStrategy).toBe('balanced');
  mockPlatform = 'ios';
  await act(async () => root.render(createElement(Copy, {}, 'Unchanged iOS')));
  expect(text().props.textBreakStrategy).toBeUndefined();
});

it.each(['android', 'ios'])(
  'keeps handset section spacing consistent on %s even with a tall usable viewport',
  async (platform) => {
    mockPlatform = platform;
    mockWidth = 400;
    await act(async () =>
      root.render(createElement(Screen, {}, createElement(Panel)))
    );
    const scroll = () =>
      root.container.queryAll((node) => node.type === 'scroll')[0];
    expect(merged(scroll().props.contentContainerStyle).gap).toBe(16);
    await act(async () =>
      root.container
        .queryAll((node) => node.type === 'keyboard')[0]
        .props.onLayout({ nativeEvent: { layout: { height: 800 } } })
    );
    expect(merged(scroll().props.contentContainerStyle).gap).toBe(16);
  }
);

it('aligns Android inline headers at the safe viewport top without shrinking Back targets', async () => {
  mockPlatform = 'android';
  await act(async () =>
    root.render(createElement(BackHeader, { title: 'Licee' }))
  );
  const header = root.container.queryAll((node) => node.type === 'view')[0];
  expect(merged(header.props.style)).toMatchObject({
    marginTop: -16,
    marginBottom: -4,
  });
  const back = root.container.queryAll((node) => node.type === 'pressable')[0];
  expect(merged(back.props.style({ pressed: false }))).toMatchObject({
    width: 48,
    minHeight: 48,
  });
  await act(async () =>
    root.render(createElement(Copy, { kind: 'heading' }, 'Heading'))
  );
  expect(
    merged(
      root.container.queryAll((node) => node.type === 'text')[0].props.style
    ).includeFontPadding
  ).toBe(false);
});

it('adapts section and card spacing to measured usable height while preserving content', async () => {
  await act(async () =>
    root.render(
      createElement(
        Screen,
        {},
        createElement(Panel, {}, createElement('text', {}, 'Visible content'))
      )
    )
  );
  const getScroll = () =>
    root.container.queryAll((node) => node.type === 'scroll')[0];
  const getPanel = () =>
    root.container.queryAll(
      (node) => node.type === 'view' && Array.isArray(node.props.style)
    )[0];
  const viewport = root.container.queryAll(
    (node) => node.type === 'keyboard'
  )[0];
  expect(merged(getScroll().props.contentContainerStyle).gap).toBe(24);
  await act(async () =>
    viewport.props.onLayout({ nativeEvent: { layout: { height: 700 } } })
  );
  expect(merged(getScroll().props.contentContainerStyle).gap).toBe(16);
  expect(merged(getPanel().props.style).gap).toBe(12);
  expect(merged(getPanel().props.style).padding).toBe(16);
  expect(
    root.container.queryAll((node) => node.type === 'text')[0].props.children
  ).toBe('Visible content');
  await act(async () =>
    viewport.props.onLayout({ nativeEvent: { layout: { height: 800 } } })
  );
  expect(merged(getScroll().props.contentContainerStyle).gap).toBe(24);
  expect(merged(getPanel().props.style).gap).toBe(16);
});

it.each(['ios', 'android'])(
  'keeps scrolling edge-to-edge on %s without duplicating the Android bar',
  async (platform) => {
    mockPlatform = platform;
    await act(async () => root.render(createElement(Screen, { tab: 'home' })));
    expect(
      root.container.queryAll((node) => node.type === 'navigation-bounds')[0]
        .props.edges.bottom
    ).toBe(false);
    expect(
      root.container.queryAll((node) => node.type === 'bottom-navigation')
    ).toHaveLength(0);
  }
);

it('keeps one Android bar outside both overlapping stack screens during push and pop', async () => {
  mockPlatform = 'android';
  const render = (detail: boolean) =>
    createElement(
      NavigationFrame,
      {},
      createElement(Screen, { key: 'catalogue', tab: 'explore' }),
      detail && createElement(Screen, { key: 'detail', tab: 'explore' })
    );
  for (const detail of [false, true, false]) {
    mockSegments = detail ? ['course', 'course-id'] : ['explore'];
    await act(async () => root.render(render(detail)));
    expect(
      root.container.queryAll((node) => node.type === 'bottom-navigation')
    ).toHaveLength(1);
  }
  for (const route of [
    '(auth)',
    'complete-profile',
    'privacy',
    'terms',
    'palette',
  ]) {
    mockSegments = [route];
    await act(async () => root.render(render(false)));
    expect(
      root.container.queryAll((node) => node.type === 'bottom-navigation')
    ).toHaveLength(0);
  }
  mockSegments = ['_tabs', 'profile'];
  await act(async () => root.render(render(false)));
  expect(
    root.container.queryAll((node) => node.type === 'bottom-navigation')
  ).toHaveLength(1);
});

it('preserves authentication spacing on short viewports', async () => {
  await act(async () => root.render(createElement(Screen, { auth: true })));
  const viewport = root.container.queryAll(
    (node) => node.type === 'keyboard'
  )[0];
  await act(async () =>
    viewport.props.onLayout({ nativeEvent: { layout: { height: 500 } } })
  );
  expect(
    merged(
      root.container.queryAll((node) => node.type === 'scroll')[0].props
        .contentContainerStyle
    )
  ).toMatchObject({ gap: 24, padding: 24 });
});
it('puts full-screen bottom protection in scroll content without reserving a footer', async () => {
  await act(async () =>
    root.render(
      createElement(Screen, {
        bottomSafeArea: 'content',
        nativeTitle: 'Preferințele tale',
      })
    )
  );
  expect(
    root.container.queryAll((node) => node.type === 'navigation-bounds')[0]
      .props.edges.bottom
  ).toBe(false);
  expect(
    merged(
      root.container.queryAll((node) => node.type === 'scroll')[0].props
        .contentContainerStyle
    ).paddingBottom
  ).toBe(16 + 34);
  expect(
    root.container.queryAll((node) => node.type === 'bottom-navigation')
  ).toHaveLength(0);
});

it('keeps detail actions in the native header and lets the header own the top inset', async () => {
  const press = jest.fn();
  const actions = createElement('button', { onPress: press });
  await act(async () =>
    root.render(
      createElement(Screen, { nativeTitle: 'Cursuri', nativeActions: actions })
    )
  );
  const options = root.container.queryAll(
    (node) => node.type === 'stack-screen'
  )[0].props.options;
  expect(options.headerRight()).toBe(actions);
  options.headerRight().props.onPress();
  expect(press).toHaveBeenCalledTimes(1);
  expect(
    root.container.queryAll((node) => node.type === 'safe-area')[0].props.edges
  ).toEqual(['left', 'right']);
});

it.each(['settings', 'qa', 'privacy-and-data', 'data-export', 'delete-account', 'privacy', 'terms', 'loading-preview', '(auth)', 'personalize'])('removes the fixed bottom footer on full-screen %s', async (route) => {
  mockSegments = [route];
  await act(async () => root.render(createElement(Screen)));
  expect(root.container.queryAll(node => node.type === 'navigation-bounds')[0].props.edges.bottom).toBe(false);
  expect(merged(root.container.queryAll(node => node.type === 'scroll')[0].props.contentContainerStyle).paddingBottom).toBe(50);
});
it('avoids fixed footers on native tab screens and full-screen routes', async () => {
  for (const [segments, reserved] of [
    [['_tabs', '(profile)', 'settings'], false],
    [['_tabs', '(profile)', 'palette'], false],
    [['teacher', '(tabs)', 'dashboard'], false],
    [['teacher', 'application'], false],
  ] as const) {
    mockSegments = [...segments];
    await act(async () => root.render(createElement(Screen)));
    expect(root.container.queryAll(node => node.type === 'navigation-bounds')[0].props.edges.bottom).toBe(reserved);
  }
});

it('lets virtualized content own scrolling without nesting another ScrollView', async () => {
  await act(async () => root.render(createElement(Screen, { nativeTitle: 'Animații ASCII', scrollable: false }, createElement('virtualized-list'))));
  expect(root.container.queryAll(node => node.type === 'scroll')).toHaveLength(0);
  expect(root.container.queryAll(node => node.type === 'virtualized-list')).toHaveLength(1);
  expect(root.container.queryAll(node => node.type === 'navigation-bounds')[0].props.edges.bottom).toBe(false);
});
