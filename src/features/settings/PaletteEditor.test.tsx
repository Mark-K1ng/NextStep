import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import PaletteEditor from './PaletteEditor';
import { PaletteProvider } from '@/providers/palette';
import { DEFAULT_COLOR } from '@/theme/palette';

const mockSet = jest.fn();
const mockToast = jest.fn();
jest.mock('@/providers/toast', () => ({ useToast: () => mockToast }));
jest.mock('@/lib/auth-storage', () => ({
  authStorage: {
    getItem: async () => null,
    setItem: (...args: unknown[]) => mockSet(...args),
  },
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  View: 'view',
  StyleSheet: { create: (s: unknown) => s },
  useWindowDimensions: () => ({ width: 400 }),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) =>
    require('react').useEffect(callback, [callback]),
}));
jest.mock('@expo/ui', () => ({ Host: 'host', Slider: 'slider' }));
jest.mock('@/components/motion', () => ({
  MotionPressable: 'button',
  StateFeedback: 'feedback',
}));
jest.mock('lucide-react-native', () => ({
  Minus: 'icon',
  Plus: 'icon',
  Bookmark: 'bookmark',
  RotateCcw: 'reset-icon',
}));
jest.mock('@/components', () => ({ Button: 'button', Input: 'input' }));
jest.mock('@/components/design', () => ({
  Screen: (props: { children?: unknown; nativeActions?: unknown }) =>
    require('react').createElement(
      'screen',
      props,
      props.nativeActions,
      props.children
    ),
  BackHeader: (props: { trailing?: unknown }) =>
    require('react').createElement('header', props, props.trailing),
  Copy: 'copy',
  Panel: 'panel',
}));
jest.mock('@/components/color-wheel', () => ({ ColorWheel: 'wheel' }));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () =>
    require('@/providers/palette').usePalettePreference().darkPalette,
}));
beforeEach(() => {
  mockSet.mockReset().mockResolvedValue(undefined);
  mockToast.mockReset();
});

it.each(['android', 'ios'])(
  'keeps all nine swatches visible at default, nearby colors and reset on %s',
  async (platform) => {
    const nativePlatform = jest.requireMock('react-native').Platform;
    nativePlatform.OS = platform;
    const root = createRoot();
    try {
      await act(async () =>
        root.render(
          createElement(PaletteProvider, null, createElement(PaletteEditor))
        )
      );
      const hint = (node: { type: unknown; props: { children?: unknown } }) =>
        node.type === 'copy' &&
        node.props.children ===
          'Schimbă culoarea pentru a vedea nuanțele modificate.';
      const verifySwatches = () => {
        expect(
          root.container.queryAll(
            (node) =>
              node.type === 'view' &&
              node.props.accessible === true &&
              /, #[0-9A-F]{6}$/.test(node.props.accessibilityLabel ?? '')
          )
        ).toHaveLength(9);
        expect(root.container.queryAll(hint)).toHaveLength(0);
      };
      const verifyDefaultLayout = () => {
        const screen = root.container.queryAll(
          (node) => node.type === 'screen'
        )[0];
        expect(screen.props.nativeTitle).toBe('Paletă de culori');
        expect(screen.props.tab).toBeUndefined();
        expect(screen.props.bottomSafeArea).toBe('content');
        expect(
          root.container.queryAll((node) => node.type === 'bookmark')[0].props
            .fill
        ).toBe('none');
        const panels = root.container.queryAll((node) => node.type === 'panel');
        const numeric = panels.find(
          (panel) =>
            panel.queryAll(
              (node) =>
                node.type === 'input' &&
                node.props.accessibilityLabel === 'RGB R'
            ).length > 0
        )!;
        expect(numeric.queryAll(hint)).toHaveLength(0);
        expect(numeric.queryAll((node) => node.type === 'input')).toHaveLength(
          6
        );
        const preview = panels.find(
          (panel) => panel.queryAll((node) => node.type === 'wheel').length > 0
        )!;
        expect(preview.queryAll(hint)).toHaveLength(0);
        verifySwatches();
      };
      verifyDefaultLayout();
      for (const hex of [
        '#7C3AEC',
        '#7C3AEE',
        '#7D3AED',
        '#000000',
        '#FFFFFF',
      ]) {
        await act(async () =>
          root.container
            .queryAll(
              (node) =>
                node.type === 'input' &&
                node.props.accessibilityLabel === 'Culoare HEX'
            )[0]
            .props.onChangeText(hex)
        );
        verifySwatches();
      }
      await act(async () =>
        root.container
          .queryAll((node) => node.type === 'wheel')[0]
          .props.onChange([120, 100, 100])
      );
      expect(root.container.queryAll(hint)).toHaveLength(0);
      verifySwatches();
      await act(async () =>
        root.container
          .queryAll(
            (node) =>
              node.type === 'button' &&
              node.props.accessibilityLabel === 'Resetează la violetul original'
          )[0]
          .props.onPress()
      );
      verifyDefaultLayout();
    } finally {
      await act(async () => root.unmount());
      nativePlatform.OS = 'android';
    }
  }
);

it('shows integer HSL without changing HEX on blur and rejects fractional HSL edits', async () => {
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(PaletteProvider, null, createElement(PaletteEditor))
      )
    );
    const field = (label: string) =>
      root.container.queryAll(
        (node) =>
          node.type === 'input' && node.props.accessibilityLabel === label
      )[0];
    const save = () =>
      root.container.queryAll(
        (node) =>
          node.type === 'button' &&
          node.props.accessibilityLabel === 'Salvează paleta'
      )[0];
    expect(['H', 'S', 'L'].map((c) => field(`HSL ${c}`).props.value)).toEqual([
      '262',
      '83',
      '58',
    ]);
    for (const c of ['H', 'S', 'L']) {
      expect(field(`HSL ${c}`).props.keyboardType).toBe('number-pad');
      await act(async () => field(`HSL ${c}`).props.onEndEditing());
    }
    expect(field('Culoare HEX').props.value).toBe(DEFAULT_COLOR);
    for (const c of ['H', 'S', 'L']) {
      for (const value of [
        '12.5',
        '12,5',
        '-1',
        '',
        c === 'H' ? '361' : '101',
      ]) {
        await act(async () => field(`HSL ${c}`).props.onChangeText(value));
        expect(save().props.disabled).toBe(true);
        expect(field('Culoare HEX').props.value).toBe(DEFAULT_COLOR);
      }
      await act(async () => field(`HSL ${c}`).props.onChangeText('0'));
      await act(async () => field(`HSL ${c}`).props.onEndEditing());
      // Restore a precise HEX before testing the next channel.
      await act(async () =>
        field('Culoare HEX').props.onChangeText(DEFAULT_COLOR)
      );
      await act(async () => field('Culoare HEX').props.onEndEditing());
    }
    await act(async () => field('HSL H').props.onChangeText('360'));
    expect(save().props.disabled).toBe(false);
    expect(mockSet).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it('steps brightness by one displayed percent and disables the endpoint actions', async () => {
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(PaletteProvider, null, createElement(PaletteEditor))
      )
    );
    const minus = () =>
      root.container.queryAll(
        (node) =>
          node.type === 'button' &&
          node.props.accessibilityLabel === 'Scade luminozitatea cu 1%'
      )[0];
    const plus = () =>
      root.container.queryAll(
        (node) =>
          node.type === 'button' &&
          node.props.accessibilityLabel === 'Crește luminozitatea cu 1%'
      )[0];
    const slider = () =>
      root.container.queryAll((node) => node.type === 'slider')[0];
    await act(async () => plus().props.onPress());
    expect(slider().props.value).toBe(94);
    await act(async () => minus().props.onPress());
    expect(slider().props.value).toBe(93);
    await act(async () => slider().props.onValueChange(100));
    expect(plus().props.disabled).toBe(true);
    await act(async () => minus().props.onPress());
    expect(slider().props.value).toBe(99);
    await act(async () => slider().props.onValueChange(0));
    expect(minus().props.disabled).toBe(true);
    await act(async () => plus().props.onPress());
    expect(slider().props.value).toBe(1);
    expect(minus().props.disabled).toBe(false);
  } finally {
    await act(async () => root.unmount());
  }
});

it('synchronizes RGB, HSL and the wheel; rejects invalid input without saving', async () => {
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(PaletteProvider, null, createElement(PaletteEditor))
      )
    );
    const inputs = () =>
      root.container.queryAll(
        (node) =>
          node.type === 'input' &&
          node.props.accessibilityLabel !== 'Culoare HEX'
      );
    const save = () =>
      root.container.queryAll(
        (node) =>
          node.type === 'button' &&
          node.props.accessibilityLabel === 'Salvează paleta'
      )[0];
    const bookmark = () =>
      root.container.queryAll((node) => node.type === 'bookmark')[0];
    const resetAction = () =>
      root.container.queryAll(
        (node) =>
          node.type === 'button' &&
          node.props.accessibilityLabel === 'Resetează la violetul original'
      )[0];
    expect(
      root.container
        .queryAll((node) => node.type === 'header')[0]
        .queryAll((node) => node.type === 'bookmark')
    ).toHaveLength(1);
    expect(bookmark().props.size).toBe(22);
    expect(bookmark().props.fill).toBe('none');
    expect(resetAction().props.disabled).toBe(true);
    expect(save().props.disabled).toBe(true);
    await act(async () => inputs()[0].props.onChangeText('256'));
    expect(save().props.disabled).toBe(true);
    expect(inputs()[0].props.value).toBe('256');
    await act(async () => inputs()[0].props.onChangeText('0'));
    expect(save().props.disabled).toBe(false);
    expect(bookmark().props.fill).toBe('none');
    expect(resetAction().props.disabled).toBe(false);
    expect(inputs()[3].props.value).toBe('225');
    await act(async () =>
      root.container
        .queryAll((node) => node.type === 'wheel')[0]
        .props.onChange([120, 100, 100])
    );
    expect(
      inputs()
        .slice(0, 3)
        .map((node) => node.props.value)
    ).toEqual(['0', '255', '0']);
    expect(
      inputs()
        .slice(3)
        .map((node) => node.props.value)
    ).toEqual(['120', '100', '50']);
    await act(async () => save().props.onPress());
    expect(mockSet).toHaveBeenCalledWith('nextstep-palette-v1', '#00FF00');
    expect(mockToast).toHaveBeenLastCalledWith(
      'Paleta a fost salvată pe acest dispozitiv.',
      'success'
    );
    expect(save().props.disabled).toBe(true);
    expect(bookmark().props.fill).not.toBe('none');
    const reset = root.container.queryAll(
      (node) =>
        node.type === 'button' &&
        node.props.accessibilityLabel === 'Resetează la violetul original'
    )[0];
    await act(async () => reset.props.onPress());
    expect(bookmark().props.fill).toBe('none');
    expect(mockToast).toHaveBeenLastCalledWith(
      'Culoarea implicită a fost restaurată și salvată.',
      'success'
    );
    expect(
      inputs()
        .slice(0, 3)
        .map((node) => node.props.value)
    ).toEqual(['124', '58', '237']);
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenLastCalledWith(
      'nextstep-palette-v1',
      DEFAULT_COLOR
    );
    expect(bookmark().props.fill).toBe('none');
    expect(save().props.disabled).toBe(true);
    expect(mockToast).toHaveBeenLastCalledWith(
      'Culoarea implicită a fost restaurată și salvată.',
      'success'
    );
  } finally {
    await act(async () => root.unmount());
  }
});
it('accepts editable HEX with or without #, synchronizes formats, and blocks incomplete or invalid values', async () => {
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(PaletteProvider, null, createElement(PaletteEditor))
      )
    );
    const hexField = () =>
      root.container.queryAll(
        (node) =>
          node.type === 'input' &&
          node.props.accessibilityLabel === 'Culoare HEX'
      )[0];
    const save = () =>
      root.container.queryAll(
        (node) =>
          node.type === 'button' &&
          node.props.accessibilityLabel === 'Salvează paleta'
      )[0];
    const rgb = () =>
      root.container
        .queryAll(
          (node) =>
            node.type === 'input' && /^RGB /.test(node.props.accessibilityLabel)
        )
        .map((node) => node.props.value);
    expect(hexField().props.value).toBe(DEFAULT_COLOR);
    for (const text of ['', '#12', '#GG0011', '#12345678']) {
      await act(async () => hexField().props.onChangeText(text));
      expect(hexField().props.value).toBe(text);
      expect(hexField().props.error).toBeTruthy();
      expect(save().props.disabled).toBe(true);
      expect(rgb()).toEqual(['124', '58', '237']);
    }
    await act(async () => hexField().props.onChangeText('00ff00'));
    expect(rgb()).toEqual(['0', '255', '0']);
    expect(save().props.disabled).toBe(false);
    await act(async () => hexField().props.onEndEditing());
    expect(hexField().props.value).toBe('#00FF00');
    await act(async () => save().props.onPress());
    expect(mockSet).toHaveBeenCalledWith('nextstep-palette-v1', '#00FF00');
    await act(async () => hexField().props.onChangeText('#0000ff'));
    expect(rgb()).toEqual(['0', '0', '255']);
    await act(async () =>
      root.container
        .queryAll((node) => node.type === 'wheel')[0]
        .props.onChange([0, 100, 100])
    );
    expect(hexField().props.value).toBe('#FF0000');
    const reset = root.container.queryAll(
      (node) =>
        node.type === 'button' &&
        node.props.accessibilityLabel === 'Resetează la violetul original'
    )[0];
    await act(async () => reset.props.onPress());
    expect(hexField().props.value).toBe(DEFAULT_COLOR);
  } finally {
    await act(async () => root.unmount());
  }
});
it('retries a failed reset and confirms only after its default-color write completes', async () => {
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(PaletteProvider, null, createElement(PaletteEditor))
      )
    );
    const action = (label: string) =>
      root.container.queryAll(
        (node) =>
          node.type === 'button' && node.props.accessibilityLabel === label
      )[0];
    await act(async () =>
      root.container
        .queryAll((node) => node.type === 'wheel')[0]
        .props.onChange([120, 100, 100])
    );
    await act(async () => action('Salvează paleta').props.onPress());
    mockToast.mockClear();
    mockSet.mockRejectedValueOnce(new Error('full'));
    await act(async () =>
      action('Resetează la violetul original').props.onPress()
    );
    expect(mockSet).toHaveBeenLastCalledWith(
      'nextstep-palette-v1',
      DEFAULT_COLOR
    );
    expect(mockToast).not.toHaveBeenCalled();
    expect(action('Resetează la violetul original').props.disabled).toBe(false);
    expect(
      root.container.queryAll(
        (node) =>
          node.type === 'copy' && node.props.accessibilityRole === 'alert'
      )
    ).toHaveLength(1);
    let finish!: () => void;
    mockSet.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    let pending!: Promise<void>;
    await act(async () => {
      pending = action('Resetează la violetul original').props.onPress();
    });
    expect(action('Resetează la violetul original').props.disabled).toBe(true);
    expect(action('Salvează paleta').props.disabled).toBe(true);
    expect(mockToast).not.toHaveBeenCalled();
    await act(async () => {
      finish();
      await pending;
    });
    expect(mockToast).toHaveBeenLastCalledWith(
      'Culoarea implicită a fost restaurată și salvată.',
      'success'
    );
    expect(action('Salvează paleta').props.disabled).toBe(true);
    expect(
      root.container.queryAll((node) => node.type === 'bookmark')[0].props.fill
    ).toBe('none');
  } finally {
    await act(async () => root.unmount());
  }
});

it('keeps the draft after a failed save and lets the user retry', async () => {
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(PaletteProvider, null, createElement(PaletteEditor))
      )
    );
    await act(async () =>
      root.container
        .queryAll((node) => node.type === 'wheel')[0]
        .props.onChange([0, 100, 100])
    );
    const save = () =>
      root.container.queryAll(
        (node) =>
          node.type === 'button' &&
          node.props.accessibilityLabel === 'Salvează paleta'
      )[0];
    mockSet.mockRejectedValueOnce(new Error('full'));
    await act(async () => save().props.onPress());
    expect(mockToast).not.toHaveBeenCalled();
    expect(
      root.container.queryAll((node) => node.type === 'bookmark')[0].props.fill
    ).toBe('none');
    expect(
      root.container.queryAll(
        (node) =>
          node.type === 'copy' && node.props.accessibilityRole === 'alert'
      )
    ).toHaveLength(1);
    expect(save().props.disabled).toBe(false);
    await act(async () => save().props.onPress());
    expect(save().props.disabled).toBe(true);
  } finally {
    await act(async () => root.unmount());
  }
});
