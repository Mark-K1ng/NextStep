jest.mock('@/hooks/use-bottom-safe-area', () => ({
  useBottomSafeArea: () => ({ content: false, inset: 0 }),
}));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => require('expo-router').useRouter(),
}));
import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import Explore from './Explore';
import { ro } from '@/i18n/ro';
import { searchCatalogue } from '@/services/catalogue';
import { Keyboard } from 'react-native';
let mockPreview = false;
const mockPreviewCounty = 'Cluj';
const mockSetPreviewCounty = jest.fn();
const mockCatalogueQuery = jest.fn();
jest.mock('@/providers/account-mode', () => ({
  useAccountMode: () => ({
    isPreview: mockPreview,
    previewCounty: mockPreviewCounty,
    setPreviewCounty: mockSetPreviewCounty,
  }),
}));
jest.mock('@/components/student-preview-banner', () => ({
  StudentPreviewBanner: () =>
    mockPreview ? require('react').createElement('preview-banner') : null,
}));
jest.mock('@/components/navigation-surface', () => ({
  NavigationSurface: 'surface',
}));

let mockPath = '/_tabs/explore';
let mockParams: { section?: string; intent?: string } = {};
let mockHardwareBack: () => boolean;
let mockDimensions = { height: 844, fontScale: 1 };
let mockPlatform = 'android';
const mockInputMount = jest.fn();
const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(),
};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockPath,
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (callback: () => void) =>
    require('react').useEffect(callback, [callback]),
}));
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatform;
    },
  },
  useWindowDimensions: () => mockDimensions,
  View: 'view',
  RefreshControl: 'refresh-control',
  StyleSheet: { create: (styles: unknown) => styles },
  Keyboard: { dismiss: jest.fn() },
  BackHandler: {
    addEventListener: (_event: string, handler: () => boolean) => {
      mockHardwareBack = handler;
      return { remove: jest.fn() };
    },
  },
  FlatList: ({ ListHeaderComponent, ListEmptyComponent, ...props }: any) => {
    const list = require('react').createElement(
      'list',
      props,
      ListHeaderComponent,
      ListEmptyComponent
    );
    // RN ScrollView wraps Android content in SwipeRefreshLayout when a refresh
    // control appears. A mock that omits this misses native field remounts.
    return mockPlatform === 'android' &&
      (props.refreshControl || props.onRefresh)
      ? require('react').createElement('refresh-wrapper', {}, list)
      : list;
  },
}));
jest.mock('lucide-react-native', () => ({
  School: 'icon',
  GraduationCap: 'icon',
  Briefcase: 'icon',
  BookOpen: 'icon',
  Layers: 'icon',
  Search: 'icon',
  ArrowLeft: 'icon',
  SlidersHorizontal: 'icon',
  BrainCircuit: 'icon',
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { values: [] }, isPending: false }),
  useInfiniteQuery: (options: unknown) => {
    mockCatalogueQuery(options);
    return {
      data: { pages: [] },
      isLoading: false,
      hasNextPage: false,
    };
  },
}));
jest.mock('@/providers/auth', () => ({
  useSession: () => ({ session: { user: { id: 'test-user' } } }),
}));
jest.mock('@/providers/journey', () => ({
  useJourney: () => ({ activeTab: 'explore' }),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));
jest.mock('@/hooks/use-profile', () => ({
  useProfileQuery: () => ({
    isSuccess: true,
    isPending: false,
    data: { county: 'Bihor' },
  }),
}));
jest.mock('@/hooks/use-debounced-value', () => ({
  useDebouncedValue: (value: string) => value,
}));
jest.mock('@/components/design', () => ({
  Copy: 'copy',
  Panel: 'panel',
  Row: 'row',
  Choice: 'choice',
  design: {},
}));
jest.mock('@/components', () => ({
  Input: (props: unknown) => {
    require('react').useEffect(() => {
      mockInputMount();
    }, []);
    return require('react').createElement('input', props);
  },
  Button: 'button',
}));
jest.mock('@/components/motion', () => ({
  MotionContent: 'content',
  MotionLayout: 'layout',
  MotionPressable: 'pressable',
}));
jest.mock('@/components/safe-area', () => ({ SafeAreaView: 'safe-area' }));
jest.mock('react-native-screens/experimental', () => ({
  SafeAreaView: 'navigation-safe-area',
}));
jest.mock('@/components/bottom-navigation', () => ({
  BottomNavigation: 'bottom-navigation',
}));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('@/components/SelectField', () => ({ SelectField: 'select-field' }));
jest.mock('./CatalogueResult', () => ({ CatalogueResult: 'result' }));
jest.mock('@/services/catalogue', () => ({ searchCatalogue: jest.fn() }));
jest.mock('@/services/catalogue-filters', () => ({
  loadCatalogueKeywords: jest.fn(),
}));
jest.mock('@/lib/option-navigation', () => ({ openOption: jest.fn() }));

let root: Root;
beforeEach(() => {
  jest.clearAllMocks();
  mockPath = '/_tabs/explore';
  mockParams = {};
  mockDimensions = { height: 844, fontScale: 1 };
  mockPlatform = 'android';
  mockPreview = false;
  mockRouter.canGoBack.mockReturnValue(true);
  root = createRoot();
});

it('keeps preview labelled and browses an ephemeral county without changing the student profile', async () => {
  mockPreview = true;
  mockParams = { section: 'schools' };
  await act(async () => root.render(createElement(Explore)));
  expect(
    root.container.queryAll((node) => node.type === 'preview-banner')
  ).toHaveLength(1);
  const selector = root.container.queryAll(
    (node) =>
      node.type === 'select-field' &&
      node.props.label === 'Județ pentru previzualizare'
  )[0];
  expect(selector.props.value).toBe('Cluj');
  expect(
    selector.props.options.some(
      (option: { value: string }) => option.value === 'Bihor'
    )
  ).toBe(true);
  await act(async () => selector.props.onChange('Bihor'));
  expect(mockSetPreviewCounty).toHaveBeenCalledWith('Bihor');
  const options = mockCatalogueQuery.mock.calls.at(-1)![0];
  await options.queryFn({ pageParam: 0, signal: new AbortController().signal });
  expect(searchCatalogue).toHaveBeenCalledWith(
    expect.objectContaining({ county: 'Cluj' })
  );
  expect(options.queryKey).toContain('preview');
});
afterEach(async () => act(async () => root.unmount()));

it.each([
  'skills',
  'schools',
  'school_profiles',
  'universities',
  'programs',
  'careers',
  'courses',
])(
  'uses one search toolbar without a category pill for %s',
  async (section) => {
    mockParams = { section };
    await act(async () => root.render(createElement(Explore)));
    expect(
      root.container.queryAll((node) => node.type === 'choice')
    ).toHaveLength(0);
    expect(
      root.container.queryAll((node) => node.type === 'input')
    ).toHaveLength(1);
    const filter = () =>
      root.container.queryAll(
        (node) =>
          node.type === 'pressable' &&
          node.props.accessibilityLabel === ro.common.filter
      )[0];
    expect(filter().props.accessibilityState.expanded).toBe(false);
    await act(async () => filter().props.onPress());
    expect(filter().props.accessibilityState.expanded).toBe(true);
    const back = root.container.queryAll(
      (node) =>
        node.type === 'pressable' &&
        node.props.accessibilityLabel === ro.common.back
    )[0];
    expect(
      Object.assign({}, ...back.props.style({ pressed: false }))
    ).toMatchObject({ width: 48, height: 48, borderRadius: 24 });
    await act(async () => back.props.onPress());
    expect(root.container.queryAll((node) => node.type === 'row')).toHaveLength(
      7
    );
  }
);

it.each(['android', 'ios'])(
  'shows all seven categories in a fixed %s menu above navigation',
  async (platform) => {
    mockPlatform = platform;
    await act(async () => root.render(createElement(Explore)));
    const list = root.container.queryAll((node) => node.type === 'list')[0];
    expect(list.props.scrollEnabled).toBe(false);
    expect(list.props.bounces).toBe(false);
    expect(list.props.onRefresh).toBeUndefined();
    const bounds = root.container.queryAll(
      (node) => node.type === 'navigation-safe-area'
    )[0];
    expect(bounds.props.edges.bottom).toBe(platform === 'ios');
    expect(root.container.queryAll((node) => node.type === 'row')).toHaveLength(
      7
    );
  }
);

it.each(['ios', 'android'])(
  'keeps %s result lists above navigation when tab inset adjustment is disabled',
  async (platform) => {
    mockPlatform = platform;
    mockParams = { section: 'courses' };
    await act(async () => root.render(createElement(Explore)));
    const bounds = root.container.queryAll(
      (node) => node.type === 'navigation-safe-area'
    )[0];
    expect(bounds.props.edges.bottom).toBe(platform === 'ios');
    expect(
      root.container.queryAll((node) => node.type === 'list')[0].props
        .scrollEnabled
    ).toBe(true);
  }
);

it('uses compact rows on a shorter phone and keeps every category available', async () => {
  mockDimensions = { height: 667, fontScale: 1 };
  await act(async () => root.render(createElement(Explore)));
  const rows = root.container.queryAll((node) => node.type === 'row');
  expect(rows).toHaveLength(7);
  expect(rows.every((node) => node.props.subtitle === undefined)).toBe(true);
  expect(
    root.container.queryAll((node) => node.type === 'list')[0].props
      .scrollEnabled
  ).toBe(false);
  await act(async () => rows[6].props.onPress());
  expect(mockRouter.push).toHaveBeenCalledWith({
    pathname: '/explore',
    params: { section: 'courses' },
  });
});

it('keeps enlarged text reachable and category results scrollable', async () => {
  mockDimensions = { height: 844, fontScale: 2 };
  await act(async () => root.render(createElement(Explore)));
  expect(
    root.container.queryAll((node) => node.type === 'list')[0].props
      .scrollEnabled
  ).toBe(true);
  await act(async () => root.unmount());
  root = createRoot();
  mockDimensions = { height: 844, fontScale: 1 };
  mockParams = { section: 'courses' };
  await act(async () => root.render(createElement(Explore)));
  const list = root.container.queryAll((node) => node.type === 'list')[0];
  expect(list.props.scrollEnabled).toBe(true);
  expect(list.props.onRefresh).toEqual(expect.any(Function));
});

it('opens a category as a native route and keeps the category menu underneath', async () => {
  await act(async () => root.render(createElement(Explore)));
  const category = root.container.queryAll(
    (node) => node.type === 'row' && node.props.title === ro.common.skills
  )[0];
  await act(async () => category.props.onPress());
  expect(mockRouter.push).toHaveBeenCalledWith({
    pathname: '/explore',
    params: { section: 'skills' },
  });
  expect(
    root.container.queryAll(
      (node) => node.type === 'row' && node.props.title === ro.common.skills
    )
  ).toHaveLength(1);
});

it.each([true, false])(
  'handles category Back with history available: %s',
  async (hasHistory) => {
    mockPath = '/explore';
    mockParams = { section: 'skills' };
    mockRouter.canGoBack.mockReturnValue(hasHistory);
    await act(async () => root.render(createElement(Explore)));
    const back = root.container.queryAll(
      (node) =>
        node.type === 'pressable' &&
        node.props.accessibilityLabel === ro.common.back
    )[0];
    await act(async () => back.props.onPress());
    if (hasHistory) expect(mockRouter.back).toHaveBeenCalledTimes(1);
    else expect(mockRouter.replace).toHaveBeenCalledWith('/_tabs/explore');
    expect(
      root.container.queryAll((node) => node.type === 'bottom-navigation')
    ).toHaveLength(0);
  }
);

it('uses native hardware Back from a category', async () => {
  mockPath = '/explore';
  mockParams = { section: 'schools', intent: 'goal' };
  await act(async () => root.render(createElement(Explore)));
  let handled = false;
  await act(async () => {
    handled = mockHardwareBack();
  });
  expect(handled).toBe(true);
  expect(mockRouter.back).toHaveBeenCalledTimes(1);
  expect(mockRouter.push).not.toHaveBeenCalled();
});

it('keeps the search input mounted and does not dismiss the keyboard while typing a live search', async () => {
  await act(async () => root.render(createElement(Explore)));
  for (const text of ['p', 'py', '', 'p', 'py', 'pyt', 'python']) {
    const input = root.container.queryAll((node) => node.type === 'input')[0];
    await act(async () => input.props.onChangeText(text));
    expect(
      root.container.queryAll((node) => node.type === 'input')[0].props.value
    ).toBe(text);
    expect(mockCatalogueQuery.mock.calls.at(-1)![0].queryKey).toContain(text);
  }
  expect(Keyboard.dismiss).not.toHaveBeenCalled();
  expect(mockRouter.push).not.toHaveBeenCalled();
  expect(mockInputMount).toHaveBeenCalledTimes(1);
  expect(
    root.container.queryAll((node) => node.type === 'input')[0].props.value
  ).toBe('python');
  expect(
    root.container.queryAll((node) => node.type === 'list')[0].props
      .scrollEnabled
  ).toBe(true);
});

it('opens filters directly and resets the selection inside the popup while preserving the main search', async () => {
  mockParams = { section: 'careers' };
  await act(async () => root.render(createElement(Explore)));
  const toolbar = () =>
    root.container.queryAll(
      (node) =>
        node.type === 'pressable' &&
        node.props.accessibilityLabel === ro.common.filter
    )[0];
  const popup = () =>
    root.container.queryAll((node) => node.type === 'select-field')[0];
  const input = () =>
    root.container.queryAll((node) => node.type === 'input')[0];
  await act(async () => input().props.onChangeText('inginer'));
  await act(async () => toolbar().props.onPress());
  expect(popup().props.presented).toBe(true);
  expect(popup().props.hideTrigger).toBe(true);
  expect(
    popup().props.options.some(
      (option: { value: string }) => option.value === ''
    )
  ).toBe(false);
  expect(
    root.container.queryAll((node) => node.type === 'content')
  ).toHaveLength(0);
  await act(async () => {
    popup().props.onChange('Tehnic');
    popup().props.onDismiss();
  });
  expect(toolbar().props.accessibilityState.selected).toBe(true);
  expect(popup().props.presented).toBe(false);
  await act(async () => toolbar().props.onPress());
  await act(async () => popup().props.onReset());
  expect(popup().props.value).toBe('');
  expect(popup().props.presented).toBe(true);
  expect(toolbar().props.accessibilityState.selected).toBe(false);
  expect(input().props.value).toBe('inginer');
});
