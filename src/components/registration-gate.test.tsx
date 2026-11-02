import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import type { User } from '@supabase/supabase-js';
import { RegistrationGate } from './registration-gate';
const mockComplete = jest.fn();
jest.mock('@/services/registration', () => ({ completeRegistration: (...args: unknown[]) => mockComplete(...args) }));
jest.mock('./data-state', () => ({ DataState: 'state' }));
jest.mock('./design', () => ({ Screen: 'screen' }));
it('retries profile completion without another signup or email screen', async () => {
  mockComplete.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
  const user = { id: 'owner' } as User;
  const root = createRoot();
  try {
    await act(async () => root.render(createElement(RegistrationGate, { user })));
    const state = () => root.container.queryAll(n => n.type === 'state')[0];
    expect(state().props.error).toBe(true);
    await act(async () => state().props.retry());
    expect(mockComplete).toHaveBeenCalledTimes(2);
    expect(mockComplete).toHaveBeenLastCalledWith(user);
    expect(state().props.loading).toBe(true);
  } finally { await act(async () => root.unmount()); }
});
