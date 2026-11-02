import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { useAppRouter } from './use-app-router.ios';

const mockRouter = {
  push: jest.fn(),
  navigate: jest.fn(),
  replace: jest.fn(),
  dismissTo: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(),
};
let mockSegments = ['_tabs', '(profile)', 'settings'];
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useSegments: () => mockSegments,
}));
jest.mock('@/providers/journey', () => ({
  useJourney: () => ({ activeTab: 'home' }),
}));

it('routes pushes and replacements through the actual native group and preserves Back', async () => {
  const root = createRoot();
  let router: ReturnType<typeof useAppRouter>;
  function Consumer() {
    router = useAppRouter();
    return null;
  }
  try {
    await act(async () => root.render(createElement(Consumer)));
    router!.push('/saved');
    expect(mockRouter.push).toHaveBeenCalledWith(
      '/_tabs/(profile)/saved',
      undefined
    );
    router!.navigate('/_tabs/explore');
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      '/_tabs/(explore)',
      undefined
    );
    router!.back();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    mockSegments = ['_tabs', '(explore)', 'school', '[id]'];
    await act(async () => root.render(createElement(Consumer)));
    router!.replace('/compare');
    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/_tabs/(explore)/compare',
      undefined
    );
    router!.dismissTo('/_tabs/home');
    expect(mockRouter.dismissTo).toHaveBeenCalledWith(
      '/_tabs/(home)',
      undefined
    );
  } finally {
    await act(async () => root.unmount());
  }
});
