import { getAccountAccess, parseAccountAccess, startTeacherApplication } from './account-access';
const mockRpc = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: { rpc: (...args: unknown[]) => mockRpc(...args) } }));
const teacher = { account_kind: 'teacher', teacher_status: 'approved', can_teach: true, application_reference: null, application_expires_at: null, application_received_at: null, review_reason: null };
it('rejects unknown or inconsistent access rather than assuming student/approved', () => {
  expect(() => parseAccountAccess(null)).toThrow();
  expect(() => parseAccountAccess({ ...teacher, account_kind: 'admin' })).toThrow();
  expect(() => parseAccountAccess({ ...teacher, account_kind: 'student' })).toThrow();
  expect(() => parseAccountAccess({ ...teacher, teacher_status: 'suspended' })).toThrow();
});
it('loads authoritative access and propagates backend failure', async () => {
  mockRpc.mockReturnValueOnce(Promise.resolve({ data: teacher, error: null }));
  expect(await getAccountAccess()).toEqual(teacher);
  mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: new Error('unavailable') }));
  await expect(getAccountAccess()).rejects.toThrow('unavailable');
});
it('starting an application preserves the actual unsubmitted status', async () => {
  const draft = { ...teacher, teacher_status: 'not_started', can_teach: false, application_reference: 'reference' };
  mockRpc.mockReturnValueOnce({ abortSignal: () => Promise.resolve({ data: draft, error: null }) });
  expect(await startTeacherApplication()).toEqual(draft);
  expect(mockRpc).toHaveBeenLastCalledWith('start_teacher_application');
});
