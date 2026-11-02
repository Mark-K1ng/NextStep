import type { User } from '@supabase/supabase-js';
import {
  readGuestIntake,
  writeGuestIntake,
  newGuestIntake,
  importGuestIntake,
  saveEducation,
  loadEducationRoute,
} from './education';
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockRemove = jest.fn();
const mockRpc = jest.fn();
const mockInvoke = jest.fn();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...a: unknown[]) => mockGet(...a),
  setItem: (...a: unknown[]) => mockSet(...a),
  removeItem: (...a: unknown[]) => mockRemove(...a),
}));
jest.mock('expo-crypto', () => ({
  randomUUID: () => '11111111-1111-4111-8111-111111111111',
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...a: unknown[]) => ({ abortSignal: () => mockRpc(...a) }),
    functions: { invoke: (...a: unknown[]) => mockInvoke(...a) },
  },
}));
const user = (id: string, intake?: string) =>
  ({ id, user_metadata: { nextstep_guest_intake: intake } }) as unknown as User;
beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue(null);
  mockSet.mockResolvedValue(undefined);
  mockRemove.mockResolvedValue(undefined);
});
it('keeps a guest draft local and resumes its stage, answers and cursor', async () => {
  const draft = {
    ...newGuestIntake(),
    grade: 'VIII',
    cursor: 1,
    responses: { interests: { domains: ['technology'] } },
  };
  await writeGuestIntake(draft);
  mockGet.mockResolvedValue(JSON.stringify(draft));
  expect(await readGuestIntake()).toEqual(draft);
  expect(mockRpc).not.toHaveBeenCalled();
});
it('does not import a guest draft during an ordinary login or a different signup', async () => {
  mockGet.mockResolvedValue(JSON.stringify(newGuestIntake()));
  expect(await importGuestIntake(user('existing'))).toBeNull();
  expect(await importGuestIntake(user('other', 'other-intake'))).toBeNull();
  expect(mockRpc).not.toHaveBeenCalled();
  expect(mockRemove).not.toHaveBeenCalled();
});
it('retains a failed import for retry, binds the initiating account and clears only acknowledged intake', async () => {
  const draft = newGuestIntake();
  mockGet.mockResolvedValue(JSON.stringify(draft));
  mockRpc.mockResolvedValueOnce({ error: new Error('offline') });
  await expect(importGuestIntake(user('new', draft.id))).rejects.toThrow(
    'offline'
  );
  expect(mockRemove).not.toHaveBeenCalled();
  mockRpc.mockResolvedValueOnce({
    data: { user_id: 'new', guest_import_id: draft.id },
    error: null,
  });
  await importGuestIntake(user('new', draft.id));
  expect(mockRpc).toHaveBeenLastCalledWith(
    'import_education_intake',
    expect.objectContaining({ expected_user: 'new', import_id: draft.id })
  );
  expect(mockRemove).toHaveBeenCalledWith('nextstep-education-intake-v1');
});
it('does not clear a replacement draft after an earlier import completes', async () => {
  const draft = newGuestIntake();
  mockGet
    .mockResolvedValueOnce(JSON.stringify(draft))
    .mockResolvedValueOnce(
      JSON.stringify({ ...draft, id: '22222222-2222-4222-8222-222222222222' })
    );
  mockRpc.mockResolvedValue({ data: { user_id: 'new' }, error: null });
  await importGuestIntake(user('new', draft.id));
  expect(mockRemove).not.toHaveBeenCalled();
});
it('rejects malformed persisted choices rather than silently uploading them', async () => {
  mockGet.mockResolvedValue(
    JSON.stringify({
      ...newGuestIntake(),
      responses: { interests: { domains: ['invented'] } },
    })
  );
  await expect(readGuestIntake()).rejects.toThrow();
});
it('keeps the loaded revision and explicit skipped questions on a questionnaire write', async () => {
  mockRpc.mockResolvedValue({ data: { revision: 5 }, error: null });
  await saveEducation(
    {
      user_id: 'owner',
      revision: 4,
      version: 1,
      responses: {},
      guest_import_id: null,
    },
    'interests',
    {
      answers: { domains: ['unknown'] },
      skipped: ['subjects'],
      cursor: 2,
      status: 'draft',
      attempt: 1,
    }
  );
  expect(mockRpc).toHaveBeenCalledWith(
    'save_education_questionnaire',
    expect.objectContaining({
      expected_user: 'owner',
      expected_revision: 4,
      skipped: ['subjects'],
      answers: { domains: ['unknown'] },
    })
  );
});
it('rejects a route response belonging to a different account', async () => {
  mockInvoke.mockResolvedValue({
    data: { userId: 'other', algorithm: 'bihor-exploration-v1' },
    error: null,
  });
  await expect(loadEducationRoute('owner')).rejects.toThrow();
});
