import { act, createElement } from 'react';
import { createRoot, type Root } from 'test-renderer';
import AuthCallback from '../app/auth-callback';
const mockReplace = jest.fn();
const mockFinish = jest.fn();
const mockRouter = { replace: mockReplace };
jest.mock('expo-linking', () => ({
  useLinkingURL: () => 'nextstep://auth-callback?code=confirmed',
}));
jest.mock('@/hooks/use-app-router', () => ({ useAppRouter: () => mockRouter }));
jest.mock('@/lib/finish-auth', () => ({
  finishAuthCallback: (...args: unknown[]) => mockFinish(...args),
}));
jest.mock('@/components/design', () => ({ Screen: 'screen', Copy: 'copy' }));
jest.mock('@/components/data-state', () => ({ DataState: 'data-state' }));
jest.mock('@/components', () => ({ Button: 'button' }));
let root: Root;
beforeEach(() => {
  jest.clearAllMocks();
  root = createRoot();
});
afterEach(async () => act(async () => root.unmount()));

it.each(['teacher', 'student'])(
  'routes confirmed %s callbacks through authoritative root branching',
  async (kind) => {
    mockFinish.mockResolvedValue({
      recovery: false,
      user: {
        email_confirmed_at: 'confirmed',
        app_metadata: { provider: 'google' },
        user_metadata: { account_kind: kind },
      },
    });
    await act(async () => root.render(createElement(AuthCallback)));
    expect(mockReplace).toHaveBeenCalledWith('/');
  }
);

it('preserves password recovery instead of opening the account dashboard', async () => {
  mockFinish.mockResolvedValue({
    recovery: true,
    user: { email_confirmed_at: 'confirmed' },
  });
  await act(async () => root.render(createElement(AuthCallback)));
  expect(mockReplace).toHaveBeenCalledWith('/(auth)/reset-password');
});
