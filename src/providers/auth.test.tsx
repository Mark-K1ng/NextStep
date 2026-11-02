import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { AuthProvider, useSession } from './auth';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: jest.fn(), onAuthStateChange: jest.fn() } },
}));
jest.mock('@/lib/finish-auth', () => ({ clearAuthCallbackCache: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ clear: jest.fn() }),
}));

it('keeps a successful auth event when the older restore request rejects', async () => {
  let rejectRestore: (reason: Error) => void;
  let notify: (event: string, session: unknown) => void;
  const unsubscribe = jest.fn();
  // Keep the client identity stable across renders, like QueryClientProvider.
  const client = { clear: jest.fn() };
  jest
    .spyOn(require('@tanstack/react-query'), 'useQueryClient')
    .mockReturnValue(client);
  jest.mocked(supabase.auth.getSession).mockReturnValue(
    new Promise((_resolve, reject) => {
      rejectRestore = reject;
    })
  );
  jest
    .mocked(supabase.auth.onAuthStateChange)
    .mockImplementation((callback: any) => {
      notify = callback;
      return { data: { subscription: { unsubscribe } } } as any;
    });
  let state: ReturnType<typeof useSession>;
  function Observer() {
    state = useSession();
    return null;
  }
  const root = createRoot();
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    await act(async () => {
      root.render(createElement(AuthProvider, null, createElement(Observer)));
    });
    const session = { user: { id: 'student' } };
    await act(async () => {
      notify!('SIGNED_IN', session);
    });
    await act(async () => {
      rejectRestore!(new Error('Old request failed'));
    });
    expect(state!.session).toBe(session);
    expect(state!.loading).toBe(false);
    expect(state!.error).toBe(false);
    expect(log).not.toHaveBeenCalled();
  } finally {
    await act(async () => {
      root.unmount();
    });
    log.mockRestore();
  }
  expect(unsubscribe).toHaveBeenCalled();
});
