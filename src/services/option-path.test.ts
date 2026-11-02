import { supabase } from '@/lib/supabase';
import { setPathSelection, isOnPath } from './option-path';
import { resolveSavedPathTarget, loadSavedPathOptions } from './saved-options';
jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn(), auth: { getUser: jest.fn() } },
}));
function setup(error: unknown = null, data: unknown = []) {
  const request: any = {};
  for (const method of [
    'select',
    'eq',
    'order',
    'limit',
    'delete',
    'upsert',
    'insert',
    'single',
    'in',
  ])
    request[method] = jest.fn(() => request);
  request.then = (resolve: any) =>
    Promise.resolve({ data, error }).then(resolve);
  jest.mocked(supabase.from).mockReturnValue(request);
  jest
    .mocked(supabase.auth.getUser)
    .mockResolvedValue({ data: { user: { id: 'owner' } }, error: null } as any);
  return request;
}
beforeEach(() => jest.resetAllMocks());
it.each([
  ['skills', 'skill'],
  ['schools', 'school'],
  ['universities', 'university'],
  ['programs', 'program'],
  ['courses', 'course'],
  ['careers', 'career'],
])(
  'maps %s list bookmarks to the same %s path target as details',
  async (category, type) => {
    await expect(
      resolveSavedPathTarget({ id: 'option', type: category })
    ).resolves.toEqual({ type, id: 'option' });
  }
);
it('resolves a specialization bookmark to its parent school', async () => {
  const request = setup(null, { school_id: 'school' });
  await expect(
    resolveSavedPathTarget({ id: 'profile', type: 'school_profiles' })
  ).resolves.toEqual({ type: 'school', id: 'school' });
  expect(supabase.from).toHaveBeenCalledWith('school_profiles');
  expect(request.eq).toHaveBeenCalledWith('id', 'profile');
});
it('rejects a path update if the signed-in account changed', async () => {
  const request = setup();
  await expect(
    setPathSelection('skill', 'option', true, 'different-user')
  ).rejects.toThrow('Session changed');
  expect(request.upsert).not.toHaveBeenCalled();
});
it('recovers existing path selections with catalogue names and counties', async () => {
  const fixtures: Record<string, unknown[]> = {
    user_progress: [
      { step_type: 'school', ref_id: 'school' },
      { step_type: 'skill', ref_id: 'skill' },
    ],
    user_goals: [{ career_id: 'career' }],
    schools: [
      { id: 'school', name: 'School', county: 'Bihor', description: null },
    ],
    skills: [
      {
        id: 'skill',
        name: 'Programming',
        category: 'Technology',
        county: null,
      },
    ],
    careers: [{ id: 'career', name: 'Engineer', domain: 'Technology' }],
  };
  jest.mocked(supabase.from).mockImplementation((table) => {
    const request: any = {};
    for (const method of ['select', 'eq', 'order', 'limit', 'in'])
      request[method] = jest.fn(() => request);
    request.then = (resolve: any) =>
      Promise.resolve({ data: fixtures[table], error: null }).then(resolve);
    return request;
  });
  const items = await loadSavedPathOptions('owner');
  expect(items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: 'school',
        name: 'School',
        county: 'Bihor',
        type: 'schools',
      }),
      expect.objectContaining({
        id: 'skill',
        domain: 'Technology',
        type: 'skills',
      }),
      expect.objectContaining({ id: 'career', type: 'careers' }),
    ])
  );
});
it('adds the university itself and preserves existing progress on repeated requests', async () => {
  const request = setup();
  await setPathSelection('university', 'institution', true);
  expect(supabase.from).toHaveBeenCalledWith('user_progress');
  expect(request.upsert).toHaveBeenCalledWith(
    {
      user_id: 'owner',
      step_type: 'university',
      ref_id: 'institution',
      status: 'in_progress',
    },
    { onConflict: 'user_id,step_type,ref_id', ignoreDuplicates: true }
  );
});
it('removes only the authenticated owner’s selected institution', async () => {
  const request = setup();
  await setPathSelection('school', 'institution', false);
  expect(request.delete).toHaveBeenCalled();
  expect(request.eq.mock.calls).toEqual([
    ['user_id', 'owner'],
    ['step_type', 'school'],
    ['ref_id', 'institution'],
  ]);
});
it('does not report success or write without a session or after a database error', async () => {
  const request = setup(new Error('offline'));
  await expect(setPathSelection('school', 'institution', true)).rejects.toThrow(
    'offline'
  );
  jest
    .mocked(supabase.auth.getUser)
    .mockResolvedValue({ data: { user: null }, error: null } as any);
  request.upsert.mockClear();
  await expect(setPathSelection('school', 'institution', true)).rejects.toThrow(
    'Session required'
  );
  expect(request.upsert).not.toHaveBeenCalled();
});
it('restores path membership when the detail page is reopened', async () => {
  const request = setup(null, [{ id: 'progress' }]);
  await expect(isOnPath('owner', 'school', 'institution')).resolves.toBe(true);
  expect(request.eq).toHaveBeenCalledWith('user_id', 'owner');
});
