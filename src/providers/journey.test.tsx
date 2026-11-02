import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { JourneyProvider, useJourney } from './journey';

let mockPathname = '/_tabs/explore';
let mockUser = 'first-user';
let mockSegments: string[] = [];
jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useSegments: () => mockSegments,
}));
jest.mock('@/providers/auth', () => ({
  useSession: () => ({ session: { user: { id: mockUser } } }),
}));
it('keeps the originating tab and first option through comparison and clears selections between accounts', async () => {
  const root = createRoot();
  let state: ReturnType<typeof useJourney>;
  const Consumer = () => {
    state = useJourney();
    return null;
  };
  const render = () =>
    root.render(createElement(JourneyProvider, {}, createElement(Consumer)));
  try {
    await act(async () => render());
    expect(state!.activeTab).toBe('explore');
    mockSegments = ['_tabs', '(profile)', 'settings'];
    await act(async () => render());
    expect(state!.activeTab).toBe('profile');
    mockSegments = [];
    await act(async () => render());
    await act(async () =>
      state!.beginComparison({ id: 'one', type: 'schools' })
    );
    mockPathname = '/compare';
    await act(async () => render());
    expect(state!.activeTab).toBe('explore');
    await act(async () =>
      state!.selectComparison({ id: 'two', type: 'schools' })
    );
    expect(state!.comparison.map((item) => item.id)).toEqual(['one', 'two']);
    await act(async () => state!.resetSecond());
    expect(state!.comparison.map((item) => item.id)).toEqual(['one']);
    mockUser = 'second-user';
    await act(async () => render());
    expect(state!.comparison).toEqual([]);
  } finally {
    await act(async () => root.unmount());
  }
});
