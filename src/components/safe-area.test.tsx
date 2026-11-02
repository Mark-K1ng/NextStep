import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { SafeAreaView } from './safe-area';

let mockPlatform = 'ios';
let mockInsets = { top: 47, right: 0, bottom: 34, left: 0 };
jest.mock('react-native', () => ({
  View: 'view',
  Platform: {
    get OS() {
      return mockPlatform;
    },
  },
  StyleSheet: {
    flatten: (style: unknown) =>
      Object.assign({}, ...[style].flat().filter(Boolean)),
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'native-safe-area',
  useSafeAreaInsets: () => mockInsets,
}));

it('applies the known iPhone inset on the very first layout instead of waiting for native padding', async () => {
  mockPlatform = 'ios';
  const root = createRoot();
  try {
    await act(async () =>
      root.render(
        createElement(
          SafeAreaView,
          { edges: ['top', 'left', 'right'], style: { padding: 16 } },
          'Heading'
        )
      )
    );
    const view = () =>
      root.container.queryAll((node) => node.type === 'view')[0];
    expect(view()).toBeDefined();
    expect(Object.assign({}, ...view().props.style)).toMatchObject({
      paddingTop: 63,
      paddingBottom: 16,
    });
    await act(async () =>
      root.render(
        createElement(
          SafeAreaView,
          { edges: ['left', 'right'], style: { padding: 16 } },
          'Native header owns the top'
        )
      )
    );
    expect(Object.assign({}, ...view().props.style)).toMatchObject({
      paddingTop: 16,
      paddingBottom: 16,
    });
    mockInsets = { top: 0, right: 47, bottom: 21, left: 47 };
    await act(async () =>
      root.render(
        createElement(
          SafeAreaView,
          { edges: ['top', 'left', 'right'], style: { padding: 16 } },
          'Landscape'
        )
      )
    );
    expect(Object.assign({}, ...view().props.style)).toMatchObject({
      paddingTop: 16,
      paddingLeft: 63,
      paddingRight: 63,
    });
  } finally {
    mockInsets = { top: 47, right: 0, bottom: 34, left: 0 };
    await act(async () => root.unmount());
  }
});
it('preserves Android native safe-area handling', async () => {
  mockPlatform = 'android';
  const root = createRoot();
  try {
    await act(async () =>
      root.render(createElement(SafeAreaView, { edges: ['top'] }, 'Android'))
    );
    expect(
      root.container.queryAll((node) => node.type === 'native-safe-area')
    ).toHaveLength(1);
  } finally {
    mockPlatform = 'ios';
    await act(async () => root.unmount());
  }
});
