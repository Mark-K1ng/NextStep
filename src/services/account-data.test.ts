import { exportMyData, deleteMyAccount } from './account-data';
const mockInvoke = jest.fn();
const mockSignOut = jest.fn();
const mockRemove = jest.fn();
jest.mock('@/lib/export-data', () => ({
  clearDataExport: jest.fn(async () => {}),
}));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => mockInvoke(...args) },
    auth: { signOut: (...args: unknown[]) => mockSignOut(...args) },
  },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  removeItem: (...args: unknown[]) => mockRemove(...args),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockRemove.mockResolvedValue(undefined);
  mockSignOut.mockResolvedValue({ error: null });
});
it('combines an owner-scoped export with the email and hydrated account bookmarks, without tokens', async () => {
  mockInvoke.mockResolvedValue({
    data: { userId: 'owner', profile: { county: 'Bihor' } },
    error: null,
  });
  const saved = [{ id: 'skill', type: 'skills', name: 'Algoritmi' }];
  expect(await exportMyData('owner', 'owner@example.com', saved)).toEqual({
    userId: 'owner',
    profile: { county: 'Bihor' },
    account: { email: 'owner@example.com' },
    savedOptions: saved,
  });
  expect(mockInvoke).toHaveBeenCalledWith('export-data');
});
it.each([null, { userId: 'other' }])(
  'rejects missing or mismatched export ownership: %p',
  async (data) => {
    mockInvoke.mockResolvedValue({ data, error: null });
    await expect(exportMyData('owner', undefined, [])).rejects.toThrow();
  }
);
it('does not clear local data or sign out when deletion fails', async () => {
  mockInvoke.mockResolvedValue({ data: null, error: new Error('Network') });
  await expect(deleteMyAccount('owner')).rejects.toThrow();
  expect(mockRemove).not.toHaveBeenCalled();
  expect(mockSignOut).not.toHaveBeenCalled();
});
it('requires explicit server success before clearing only the deleted owner local data', async () => {
  mockInvoke.mockResolvedValueOnce({ data: {}, error: null });
  await expect(deleteMyAccount('owner')).rejects.toThrow();
  expect(mockRemove).not.toHaveBeenCalled();
  mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null });
  await deleteMyAccount('owner');
  expect(mockRemove).toHaveBeenCalledWith('nextstep-saved-owner');
  expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
});
