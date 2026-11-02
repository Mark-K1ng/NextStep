import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import Compare from './Compare';
import { ro } from '@/i18n/ro';

const records = [
  {
    id: 'one',
    type: 'schools',
    name: 'First school',
    county: 'Bihor',
    specialization: 'Matematică',
    description: 'First description',
  },
  {
    id: 'two',
    type: 'schools',
    name: 'Second school',
    county: 'Bihor',
    specialization: 'Filologie',
    description: 'Second description',
  },
];
let mockComparison = [
  { ...records[0], specialization: undefined, description: undefined },
  records[1],
];
let mockPending = false;
let mockError = false;
let mockWidth = 400;
let mockFontScale = 1;
const mockRefetch = jest.fn();
const mockOpenOption = jest.fn();
const mockResetSecond = jest.fn();
jest.mock('@/lib/option-navigation', () => ({
  openOption: (...args: unknown[]) => mockOpenOption(...args),
}));
jest.mock('react-native', () => ({
  View: 'view',
  StyleSheet: { create: (value: unknown) => value },
  Platform: { OS: 'android' },
  useWindowDimensions: () => ({ width: mockWidth, fontScale: mockFontScale }),
}));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
}));
jest.mock('@/components/design', () => ({
  Screen: 'screen',
  BackHeader: 'header',
  Copy: 'copy',
  GroupedList: 'group',
  Panel: 'panel',
  Row: 'row',
  Section: 'section',
}));
jest.mock('@/components', () => ({ Button: 'button', Input: 'input' }));
jest.mock('@/components/motion', () => ({ MotionContent: 'motion' }));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('@/features/explore/CatalogueResult', () => ({
  CatalogueResult: 'result',
}));
jest.mock('@/providers/journey', () => ({
  useJourney: () => ({
    comparison: mockComparison,
    selectComparison: jest.fn(),
    resetSecond: mockResetSecond,
  }),
}));
jest.mock('@/providers/auth', () => ({
  useSession: () => ({ session: { user: { id: 'user' } } }),
}));
jest.mock('@/hooks/use-profile', () => ({
  useProfileQuery: () => ({ isSuccess: true, data: { county: 'Bihor' } }),
}));
jest.mock('@/hooks/use-debounced-value', () => ({
  useDebouncedValue: (value: unknown) => value,
}));
jest.mock('@/providers/account-mode', () => ({
  useAccountMode: () => ({ isPreview: false }),
}));
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({}) }));
jest.mock('@/services/catalogue', () => ({ searchCatalogue: jest.fn() }));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: () => ({}),
  useQuery: () => ({
    data:
      mockPending || mockError
        ? undefined
        : mockComparison.map((selected) =>
            records.find((row) => row.id === selected.id)
          ),
    isPending: mockPending,
    isError: mockError,
    refetch: mockRefetch,
  }),
}));
let root: Root;
beforeEach(() => {
  mockPending = false;
  mockError = false;
  mockRefetch.mockClear();
  mockOpenOption.mockClear();
  mockResetSecond.mockClear();
  mockWidth = 400;
  mockFontScale = 1;
  root = createRoot();
});
afterEach(async () => act(async () => root.unmount()));

it.each([false, true])(
  'loads complete facts for the initiating school with reversed order=%s',
  async (reverse) => {
    const [first, second] = reverse ? [...records].reverse() : records;
    mockComparison = [
      { ...first, specialization: undefined, description: undefined },
      second,
    ];
    await act(async () => root.render(createElement(Compare)));
    const values = root.container
      .queryAll((node) => node.type === 'copy')
      .map((node) => node.props.children);
    expect(values).toContain(first.specialization);
    expect(values).toContain(first.description);
    expect(values).toContain(second.specialization);
    expect(values).not.toContain(ro.common.notAvailable);
  }
);
it.each(['loading', 'error'])(
  'shows %s recovery instead of treating unloaded facts as unavailable',
  async (state) => {
    mockPending = state === 'loading';
    mockError = state === 'error';
    await act(async () => root.render(createElement(Compare)));
    const view = root.container.queryAll(
      (node) => node.type === 'data-state'
    )[0];
    expect(view).toBeDefined();
    expect(view.props.loading).toBe(mockPending);
    expect(view.props.error).toBe(mockError);
    if (mockError) {
      await act(async () => view.props.retry());
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    }
  }
);
it.each([
  [320, 1],
  [400, 1.6],
])(
  'keeps fact ownership readable at width %s and font scale %s',
  async (width, fontScale) => {
    mockWidth = width;
    mockFontScale = fontScale;
    await act(async () => root.render(createElement(Compare)));
    const values = root.container
      .queryAll((node) => node.type === 'copy')
      .map((node) => node.props.children);
    expect(values).toContain(
      `${ro.comparison.option} 1 · ${mockComparison[0].name}`
    );
    expect(values).toContain(
      `${ro.comparison.option} 2 · ${mockComparison[1].name}`
    );
  }
);
it('opens either option, expands both descriptions, and retains the second-option replacement action', async () => {
  await act(async () => root.render(createElement(Compare)));
  const rows = root.container.queryAll((node) => node.type === 'row');
  expect(rows).toHaveLength(2);
  await act(async () => rows[0].props.onPress());
  expect(mockOpenOption).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ id: mockComparison[0].id })
  );
  await act(async () => rows[1].props.onPress());
  expect(mockOpenOption).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ id: mockComparison[1].id })
  );
  const expand = root.container.queryAll(
    (node) =>
      node.type === 'button' && node.props.children === ro.common.showMore
  )[0];
  await act(async () => expand.props.onPress());
  expect(
    root.container.queryAll(
      (node) =>
        node.type === 'button' && node.props.children === ro.common.showLess
    )
  ).toHaveLength(1);
  const replace = root.container.queryAll(
    (node) =>
      node.type === 'button' && node.props.children === ro.refinement.replace
  )[0];
  await act(async () => replace.props.onPress());
  expect(mockResetSecond).toHaveBeenCalledTimes(1);
});
