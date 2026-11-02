import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { completeRegistration, parseStringArray } from './registration';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: { updateUser: jest.fn() },
  },
}));
beforeEach(() => {
  jest.mocked(supabase.rpc).mockResolvedValue({
    data: { account_kind: 'student' },
    error: null,
  } as never);
});
afterEach(() => jest.resetAllMocks());

it('ignores malformed onboarding arrays', () => {
  expect(parseStringArray('not json')).toEqual([]);
  expect(parseStringArray('{"value":"not an array"}')).toEqual([]);
  expect(parseStringArray('["Matematică",123,null]')).toEqual(['Matematică']);
});

it('does not overwrite an established profile on later sign-ins', async () => {
  await completeRegistration({
    id: 'user',
    email_confirmed_at: 'confirmed',
    user_metadata: {},
  } as User);
  expect(supabase.from).not.toHaveBeenCalled();
});

it('does not write a pending profile before email confirmation', async () => {
  await completeRegistration({
    id: 'user',
    user_metadata: { nextstep_profile_pending: {} },
  } as User);
  expect(supabase.from).not.toHaveBeenCalled();
  expect(supabase.rpc).not.toHaveBeenCalled();
});

it('saves confirmed onboarding under the owner ID and clears the pending marker', async () => {
  const single = jest
    .fn()
    .mockResolvedValue({ error: null, data: { id: 'user' } });
  const eq = jest.fn(() => ({ select: () => ({ single }) }));
  const update = jest.fn((_profile: Record<string, unknown>) => ({ eq }));
  jest
    .mocked(supabase.from)
    .mockReturnValue({ update, upsert: jest.fn().mockResolvedValue({ error: null }) } as unknown as ReturnType<typeof supabase.from>);
  jest
    .mocked(supabase.auth.updateUser)
    .mockResolvedValue({ data: { user: null }, error: null });
  await completeRegistration({
    id: 'user',
    email_confirmed_at: 'confirmed',
    user_metadata: {
      nextstep_profile_pending: {
        display_name: 'Ana',
        county: 'Cluj',
        grade_level: 'IX',
        interests: ['Informatică'],
        favorite_subjects: [],
      },
    },
  } as User);
  expect(supabase.from('profiles').upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'user', interests: ['Informatică'] }), { onConflict: 'id', ignoreDuplicates: true });
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ grade_level: 'IX', county: 'Cluj' }));
  expect(update.mock.calls[0][0]).not.toHaveProperty('id');
  expect(eq).toHaveBeenCalledWith('id', 'user');
  expect(supabase.auth.updateUser).toHaveBeenCalledWith({
    data: { nextstep_profile_pending: null },
  });
});

it('completes authoritative teacher identity without writing student grade or location', async () => {
  jest.mocked(supabase.rpc).mockResolvedValue({
    data: { account_kind: 'teacher' },
    error: null,
  } as never);
  const update = jest.fn(() => ({
    eq: () => ({
      select: () => ({
        single: async () => ({ data: { id: 'teacher' }, error: null }),
      }),
    }),
  }));
  jest.mocked(supabase.from).mockReturnValue({ update, upsert: jest.fn().mockResolvedValue({ error: null }) } as never);
  jest
    .mocked(supabase.auth.updateUser)
    .mockResolvedValue({ data: { user: null }, error: null });
  await completeRegistration({
    id: 'teacher',
    email_confirmed_at: 'confirmed',
    user_metadata: {
      nextstep_profile_pending: { display_name: 'Profesor Ana' },
    },
  } as User);
  expect(update).toHaveBeenCalledWith({ display_name: 'Profesor Ana' });
  expect(supabase.auth.updateUser).toHaveBeenCalledWith({
    data: { nextstep_profile_pending: null },
  });
});

it('does not trust editable teacher intent to bypass the student account profile', async () => {
  await expect(
    completeRegistration({
      id: 'student',
      email_confirmed_at: 'confirmed',
      user_metadata: {
        account_kind: 'teacher',
        nextstep_profile_pending: { display_name: 'Ana' },
      },
    } as User)
  ).rejects.toThrow('Invalid registration profile');
  expect(supabase.from).not.toHaveBeenCalled();
  expect(supabase.auth.updateUser).not.toHaveBeenCalled();
});

it('retains pending registration when authoritative access is unavailable', async () => {
  jest
    .mocked(supabase.rpc)
    .mockResolvedValue({ data: null, error: new Error('offline') } as never);
  await expect(
    completeRegistration({
      id: 'teacher',
      email_confirmed_at: 'confirmed',
      user_metadata: {
        account_kind: 'teacher',
        nextstep_profile_pending: { display_name: 'Ana' },
      },
    } as User)
  ).rejects.toThrow('offline');
  expect(supabase.auth.updateUser).not.toHaveBeenCalled();
});
