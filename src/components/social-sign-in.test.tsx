import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { SocialSignIn } from './social-sign-in';
let mockGoogle = false;
let mockApple = false;
let mockOS = 'android';
jest.mock('@/constants/release-capabilities', () => ({
  get GOOGLE_AUTH_ENABLED() {
    return mockGoogle;
  },
  get APPLE_AUTH_ENABLED() {
    return mockApple;
  },
}));
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockOS;
    },
  },
  View: 'view',
  StyleSheet: { create: (value: unknown) => value },
}));
jest.mock('@/hooks/use-app-router', () => ({
  useAppRouter: () => ({ replace: jest.fn() }),
}));
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({}) }));
jest.mock('@/services/social-auth', () => ({
  signInWithSocialProvider: jest.fn(),
}));
jest.mock('./Button', () => ({ Button: 'button' }));
jest.mock('./design', () => ({ Copy: 'copy' }));
it.each([
  ['android', false, false, 0],
  ['android', false, true, 0],
  ['android', true, false, 1],
  ['ios', false, true, 1],
  ['ios', true, true, 2],
])(
  'shows only verified providers on %s (%s, %s)',
  async (os, google, apple, count) => {
    mockOS = os as string;
    mockGoogle = google as boolean;
    mockApple = apple as boolean;
    const root = createRoot();
    await act(async () => root.render(createElement(SocialSignIn)));
    expect(
      root.container.queryAll((node) => node.type === 'button')
    ).toHaveLength(count as number);
    if (!count) expect(root.container.children).toHaveLength(0);
    await act(async () => root.unmount());
  }
);
