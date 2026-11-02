jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { createAnimatedComponent: (component: unknown) => component },
}));
jest.mock('react-native-worklets', () => ({}));
import { act, createElement, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'test-renderer';
import { SelectField } from './SelectField';
import { CountySelect, GradeSelect } from './profile-selectors';
import { ro } from '@/i18n/ro';
import { COUNTIES } from '@/constants/profile-options';
import { Keyboard } from 'react-native';
jest.mock('@/components/motion', () => ({
  MotionPressable: 'pressable',
  MotionChevron: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('./selection-sheet', () => ({
  SelectionSheet: ({
    isPresented,
    children,
  }: {
    isPresented: boolean;
    children: (height: number) => ReactNode;
  }) => (isPresented ? children(620) : null),
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  View: 'view',
  Text: 'text',
  TextInput: 'input',
  Pressable: 'pressable',
  Keyboard: { dismiss: jest.fn() },
  StyleSheet: { create: (value: unknown) => value },
  useWindowDimensions: () => ({ height: 844, width: 390, fontScale: 1 }),
  FlatList: ({ data, renderItem, ListEmptyComponent }: any) =>
    require('react').createElement(
      'list',
      {},
      data.length
        ? data.map((item: any) =>
            require('react').createElement(
              'item',
              { key: item.value },
              renderItem({ item })
            )
          )
        : ListEmptyComponent
    ),
}));
jest.mock('lucide-react-native', () => ({
  Check: 'icon',
  RotateCcw: 'reset-icon',
  ChevronDown: 'icon',
  Search: 'icon',
  X: 'icon',
  GraduationCap: 'icon',
  MapPin: 'icon',
  Building2: 'icon',
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => require('@/theme/tokens').darkColors,
}));

const press = async (root: Root, label: string, role = 'button') => {
  const element = root.container.queryAll(
    (node) =>
      node.props.accessibilityRole === role &&
      node.props.accessibilityLabel === label
  )[0];
  expect(element).toBeDefined();
  await act(async () => element.props.onPress());
};
const search = async (root: Root, value: string) => {
  const input = root.container.queryAll((node) => node.type === 'input')[0];
  await act(async () => input.props.onChangeText(value));
};
const radios = (root: Root) =>
  root.container.queryAll((node) => node.props.accessibilityRole === 'radio');

beforeEach(() => jest.clearAllMocks());

it('searches counties without diacritics and keeps the sector when reselecting the same county', async () => {
  const changed = jest.fn();
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(CountySelect, {
          county: 'București',
          sector: 3,
          onChange: changed,
        })
      )
    );
    await press(root, ro.profile.county);
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
    await search(root, 'bucuresti');
    expect(radios(root).map((node) => node.props.accessibilityLabel)).toEqual([
      'București',
    ]);
    expect(radios(root)[0].props.accessibilityState.checked).toBe(true);
    await press(root, 'București', 'radio');
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(2);
    expect(changed).not.toHaveBeenCalled();
    expect(radios(root)).toHaveLength(0);
  } finally {
    await act(async () => root.unmount());
  }
});

it('closes a searched county sheet with the accessibility escape gesture without changing the county', async () => {
  const changed = jest.fn();
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(CountySelect, { county: 'Bihor', onChange: changed })
      )
    );
    await press(root, ro.profile.county);
    await search(root, 'bucuresti');
    const sheet = root.container.queryAll(
      (node) => node.props.accessibilityViewIsModal === true
    )[0];
    await act(async () => sheet.props.onAccessibilityEscape());
    expect(radios(root)).toHaveLength(0);
    expect(changed).not.toHaveBeenCalled();
    expect(Keyboard.dismiss).toHaveBeenCalledTimes(2);
    await press(root, ro.profile.county);
    expect(radios(root)).toHaveLength(COUNTIES.length);
  } finally {
    await act(async () => root.unmount());
  }
});

it('makes the missing sector error available from its field and an Android live region', async () => {
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(CountySelect, {
          county: 'București',
          onChange: jest.fn(),
        })
      )
    );
    const sector = root.container.queryAll(
      (node) =>
        node.props.accessibilityRole === 'button' &&
        node.props.accessibilityLabel === ro.profileChoices.sector
    )[0];
    expect(sector.props.accessibilityHint).toBe(
      ro.profileChoices.sectorRequired
    );
    const error = root.container.queryAll(
      (node) => node.props.accessibilityRole === 'alert'
    )[0];
    expect(error.props.accessibilityLiveRegion).toBe('polite');
  } finally {
    await act(async () => root.unmount());
  }
});

it('never saves arbitrary search text, resets search on close and clears the sector for a different county', async () => {
  const changed = jest.fn();
  function Fixture() {
    const [location, setLocation] = useState({
      county: 'București',
      sector: 3 as number | null,
    });
    return createElement(CountySelect, {
      ...location,
      onChange: (county, sector) => {
        changed(county, sector);
        setLocation({ county, sector });
      },
    });
  }
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(Fixture)));
    await press(root, ro.profile.county);
    await search(root, 'Atlantida');
    expect(radios(root)).toHaveLength(0);
    expect(changed).not.toHaveBeenCalled();
    await press(root, ro.common.close);
    await press(root, ro.profile.county);
    expect(radios(root)).toHaveLength(COUNTIES.length);
    await search(root, 'bihor');
    await press(root, 'Bihor', 'radio');
    expect(changed).toHaveBeenCalledWith('Bihor', null);
    expect(
      root.container.queryAll(
        (node) => node.props.accessibilityLabel === ro.profileChoices.sector
      )
    ).toHaveLength(0);
  } finally {
    await act(async () => root.unmount());
  }
});

it('selects a listed class value rather than a free-text label', async () => {
  const changed = jest.fn();
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(GradeSelect, { value: 'VIII', onChange: changed })
      )
    );
    await press(root, ro.profile.gradeLevel);
    expect(radios(root)).toHaveLength(9);
    await press(root, 'Clasa a IX-a, Liceu', 'radio');
    expect(changed).toHaveBeenCalledWith('IX');
    expect(radios(root)).toHaveLength(0);
  } finally {
    await act(async () => root.unmount());
  }
});

it('recovers from an empty search using the popup clear action without changing the selection', async () => {
  const changed = jest.fn();
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(CountySelect, { county: 'Bihor', onChange: changed })
      )
    );
    await press(root, ro.profile.county);
    await search(root, 'Atlantida');
    expect(radios(root)).toHaveLength(0);
    expect(
      root.container.queryAll(
        (node) =>
          node.type === 'text' &&
          node.props.children === ro.profileChoices.searchAgain
      )
    ).toHaveLength(1);
    await press(root, ro.profileChoices.clearSearch);
    expect(radios(root)).toHaveLength(COUNTIES.length);
    expect(
      radios(root).find((node) => node.props.accessibilityLabel === 'Bihor')
        ?.props.accessibilityState.checked
    ).toBe(true);
    expect(changed).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it('resets the active filter and popup search without closing the controlled popup', async () => {
  const reset = jest.fn();
  const dismiss = jest.fn();
  const changed = jest.fn();
  function Fixture() {
    const [value, setValue] = useState('tech');
    return createElement(SelectField, {
      label: ro.refinement.filterKeyword,
      sheetTitle: ro.refinement.filterOptions,
      presented: true,
      hideTrigger: true,
      value,
      options: [{ value: 'tech', label: 'Tehnic' }],
      searchPlaceholder: ro.common.search,
      onChange: changed,
      onDismiss: dismiss,
      onReset: () => {
        reset();
        setValue('');
      },
    });
  }
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(Fixture)));
    expect(
      root.container.queryAll(
        (node) => node.props.accessibilityLabel === ro.refinement.filterKeyword
      )
    ).toHaveLength(0);
    await search(root, 'missing');
    expect(radios(root)).toHaveLength(0);
    const resetButton = root.container.queryAll(
      (node) => node.props.accessibilityLabel === ro.refinement.reset
    )[0];
    expect(
      resetButton.queryAll((node) => node.type === 'reset-icon')
    ).toHaveLength(1);
    await press(root, ro.refinement.reset);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(radios(root)).toHaveLength(1);
    expect(radios(root)[0].props.accessibilityState.checked).toBe(false);
    expect(
      root.container.queryAll((node) => node.type === 'input')[0].props.value
    ).toBe('');
    expect(dismiss).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});
